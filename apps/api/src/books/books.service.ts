import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, QueryBooksDto } from './dto/book.dto';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '@lms/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBooksDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { contains: query.search, mode: 'insensitive' } },
        { isbn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    const [total, books] = await Promise.all([
      this.prisma.book.count({ where }),
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        borrowings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { member: true },
        },
      },
    });

    if (!book) {
      throw new BusinessException(
        ErrorCode.BOOK_NOT_FOUND,
        `Book with ID ${id} was not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    return book;
  }

  async create(dto: CreateBookDto) {
    const existing = await this.prisma.book.findUnique({
      where: { isbn: dto.isbn },
    });

    if (existing) {
      throw new BusinessException(
        ErrorCode.DUPLICATE_ISBN,
        `A book with ISBN ${dto.isbn} already exists.`,
        HttpStatus.CONFLICT
      );
    }

    return this.prisma.book.create({
      data: {
        ...dto,
        availableCopies: dto.totalCopies,
      },
    });
  }

  async update(id: string, dto: UpdateBookDto) {
    const book = await this.findOne(id);

    if (dto.isbn && dto.isbn !== book.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existing) {
        throw new BusinessException(
          ErrorCode.DUPLICATE_ISBN,
          `A book with ISBN ${dto.isbn} already exists.`,
          HttpStatus.CONFLICT
        );
      }
    }

    // Adjust availableCopies if totalCopies changes
    let availableCopies = book.availableCopies;
    if (dto.totalCopies !== undefined) {
      const difference = dto.totalCopies - book.totalCopies;
      availableCopies = Math.max(0, book.availableCopies + difference);
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
        availableCopies,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if there are any active borrowings
    const activeBorrowing = await this.prisma.borrowing.findFirst({
      where: {
        bookId: id,
        status: { in: ['BORROWED', 'OVERDUE'] },
      },
    });

    if (activeBorrowing) {
      throw new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        'Cannot delete book while copies are currently borrowed or overdue.',
        HttpStatus.CONFLICT
      );
    }

    return this.prisma.book.delete({ where: { id } });
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.book.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return categories.map((c) => c.category);
  }
}
