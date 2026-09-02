import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowingDto, QueryBorrowingsDto } from './dto/borrowing.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '@lms/types';
import { BorrowingStatus, MemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class BorrowingsService {
  private readonly maxActiveBorrowings: number;
  private readonly dailyFine: number;
  private readonly defaultBorrowDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.maxActiveBorrowings = Number(
      this.configService.get('MAX_ACTIVE_BORROWINGS', 3)
    );
    this.dailyFine = Number(this.configService.get('DAILY_FINE', 5000));
    this.defaultBorrowDays = Number(
      this.configService.get('DEFAULT_BORROW_DAYS', 14)
    );
  }

  async findAll(query: QueryBorrowingsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BorrowingWhereInput = {};

    if (query.memberId) {
      where.memberId = query.memberId;
    }
    if (query.bookId) {
      where.bookId = query.bookId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [total, borrowings] = await Promise.all([
      this.prisma.borrowing.count({ where }),
      this.prisma.borrowing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: true,
          book: true,
        },
      }),
    ]);

    return {
      data: borrowings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id },
      include: {
        member: true,
        book: true,
      },
    });

    if (!borrowing) {
      throw new BusinessException(
        ErrorCode.BORROWING_NOT_FOUND,
        `Borrowing transaction with ID ${id} was not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    return borrowing;
  }

  /**
   * Core Business Logic: Borrow a book
   * 1. Validate member exists & is ACTIVE (MEMBER_INACTIVE)
   * 2. Validate member has no overdue loans (OVERDUE_BORROWING_EXISTS)
   * 3. Validate member active loan count < MAX_ACTIVE_BORROWINGS (BORROWING_LIMIT_REACHED)
   * 4. Atomic transaction with row lock / conditional check on book stock > 0 (BOOK_OUT_OF_STOCK)
   * 5. Decrement availableCopies and create borrowing record
   */
  async borrowBook(dto: CreateBorrowingDto) {
    // 1. Validate Member
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      include: {
        borrowings: {
          where: { status: { in: [BorrowingStatus.BORROWED, BorrowingStatus.OVERDUE] } },
        },
      },
    });

    if (!member) {
      throw new BusinessException(
        ErrorCode.MEMBER_NOT_FOUND,
        `Member with ID ${dto.memberId} was not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (member.status !== MemberStatus.ACTIVE) {
      throw new BusinessException(
        ErrorCode.MEMBER_INACTIVE,
        'Member is inactive and cannot borrow books.',
        HttpStatus.CONFLICT
      );
    }

    // 2. Check Overdue loans
    const now = new Date();
    const hasOverdue = member.borrowings.some(
      (b) => b.status === BorrowingStatus.OVERDUE || (b.status === BorrowingStatus.BORROWED && new Date(b.dueAt) < now)
    );

    if (hasOverdue) {
      throw new BusinessException(
        ErrorCode.OVERDUE_BORROWING_EXISTS,
        'Member has an overdue book and cannot borrow another book.',
        HttpStatus.CONFLICT
      );
    }

    // 3. Check active borrowings limit
    if (member.borrowings.length >= this.maxActiveBorrowings) {
      throw new BusinessException(
        ErrorCode.BORROWING_LIMIT_REACHED,
        `Member has reached the maximum of ${this.maxActiveBorrowings} active borrowings.`,
        HttpStatus.CONFLICT
      );
    }

    // 4. Atomic PostgreSQL Transaction with stock decrement
    return await this.prisma.$transaction(async (tx) => {
      // Find book inside transaction
      const book = await tx.book.findUnique({
        where: { id: dto.bookId },
      });

      if (!book) {
        throw new BusinessException(
          ErrorCode.BOOK_NOT_FOUND,
          `Book with ID ${dto.bookId} was not found.`,
          HttpStatus.NOT_FOUND
        );
      }

      if (book.availableCopies <= 0) {
        throw new BusinessException(
          ErrorCode.BOOK_OUT_OF_STOCK,
          'Book is currently unavailable.',
          HttpStatus.CONFLICT
        );
      }

      // Safe concurrency decrement: update only if availableCopies > 0
      const updateResult = await tx.book.updateMany({
        where: {
          id: dto.bookId,
          availableCopies: { gt: 0 },
        },
        data: {
          availableCopies: { decrement: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new BusinessException(
          ErrorCode.BOOK_OUT_OF_STOCK,
          'Book is currently unavailable.',
          HttpStatus.CONFLICT
        );
      }

      // Compute dueAt
      const dueAt = dto.dueAt
        ? new Date(dto.dueAt)
        : new Date(now.getTime() + this.defaultBorrowDays * 24 * 60 * 60 * 1000);

      // Create borrowing record
      const borrowing = await tx.borrowing.create({
        data: {
          memberId: dto.memberId,
          bookId: dto.bookId,
          borrowedAt: now,
          dueAt,
          status: BorrowingStatus.BORROWED,
          lateDays: 0,
          fineAmount: 0,
        },
        include: {
          member: true,
          book: true,
        },
      });

      return borrowing;
    });
  }

  /**
   * Core Business Logic: Return a book
   * 1. Validate borrowing exists and is not already RETURNED (ALREADY_RETURNED)
   * 2. Calculate lateDays = max(0, returnedAt - dueAt)
   * 3. Calculate fineAmount = lateDays * DAILY_FINE
   * 4. Atomic transaction: update borrowing to RETURNED and increment book availableCopies
   */
  async returnBook(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      const borrowing = await tx.borrowing.findUnique({
        where: { id },
        include: { book: true, member: true },
      });

      if (!borrowing) {
        throw new BusinessException(
          ErrorCode.BORROWING_NOT_FOUND,
          `Borrowing record with ID ${id} was not found.`,
          HttpStatus.NOT_FOUND
        );
      }

      if (borrowing.status === BorrowingStatus.RETURNED) {
        throw new BusinessException(
          ErrorCode.ALREADY_RETURNED,
          'This borrowing transaction has already been returned.',
          HttpStatus.CONFLICT
        );
      }

      const returnedAt = new Date();
      const dueDate = new Date(borrowing.dueAt);

      let lateDays = 0;
      if (returnedAt > dueDate) {
        const diffMs = returnedAt.getTime() - dueDate.getTime();
        lateDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      const fineAmount = lateDays * this.dailyFine;

      // Update Borrowing
      const updatedBorrowing = await tx.borrowing.update({
        where: { id },
        data: {
          status: BorrowingStatus.RETURNED,
          returnedAt,
          lateDays,
          fineAmount,
        },
        include: {
          book: true,
          member: true,
        },
      });

      // Increment availableCopies atomically
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: {
          availableCopies: { increment: 1 },
        },
      });

      return {
        borrowing: updatedBorrowing,
        lateDays,
        fineAmount,
      };
    });
  }

  async getDashboardMetrics() {
    const [totalBooks, totalMembers, activeLoans, overdueLoans] =
      await Promise.all([
        this.prisma.book.count(),
        this.prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
        this.prisma.borrowing.count({
          where: { status: BorrowingStatus.BORROWED },
        }),
        this.prisma.borrowing.count({
          where: {
            OR: [
              { status: BorrowingStatus.OVERDUE },
              {
                status: BorrowingStatus.BORROWED,
                dueAt: { lt: new Date() },
              },
            ],
          },
        }),
      ]);

    const recentTransactions = await this.prisma.borrowing.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        member: true,
        book: true,
      },
    });

    return {
      totalBooks,
      activeMembers: totalMembers,
      activeLoans,
      overdueLoans,
      recentTransactions,
    };
  }
}
