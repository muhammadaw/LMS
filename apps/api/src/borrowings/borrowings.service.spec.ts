import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BorrowingsService } from './borrowings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '@lms/types';
import { MemberStatus, BorrowingStatus } from '@prisma/client';

describe('BorrowingsService (Business Rules & TDD)', () => {
  let service: BorrowingsService;
  let prisma: any;

  const mockActiveMember = {
    id: 'mem-1',
    name: 'Alice',
    memberNumber: 'MEM-001',
    email: 'alice@example.com',
    status: MemberStatus.ACTIVE,
    borrowings: [],
  };

  const mockInactiveMember = {
    id: 'mem-2',
    name: 'Charlie',
    memberNumber: 'MEM-002',
    email: 'charlie@example.com',
    status: MemberStatus.INACTIVE,
    borrowings: [],
  };

  const mockAvailableBook = {
    id: 'book-1',
    title: 'Clean Architecture',
    totalCopies: 3,
    availableCopies: 2,
  };

  const mockOutOfStockBook = {
    id: 'book-2',
    title: 'Domain-Driven Design',
    totalCopies: 2,
    availableCopies: 0,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      member: {
        findUnique: jest.fn(),
      },
      book: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      borrowing: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def: any) => {
              if (key === 'MAX_ACTIVE_BORROWINGS') return 3;
              if (key === 'DAILY_FINE') return 5000;
              if (key === 'DEFAULT_BORROW_DAYS') return 14;
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BorrowingsService>(BorrowingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Borrowing Business Rules', () => {
    it('should successfully borrow a book when all conditions are met', async () => {
      prisma.member.findUnique.mockResolvedValue(mockActiveMember);
      prisma.book.findUnique.mockResolvedValue(mockAvailableBook);
      prisma.book.updateMany.mockResolvedValue({ count: 1 });
      prisma.borrowing.create.mockResolvedValue({
        id: 'borrow-1',
        memberId: mockActiveMember.id,
        bookId: mockAvailableBook.id,
        status: BorrowingStatus.BORROWED,
      });

      const result = await service.borrowBook({
        memberId: mockActiveMember.id,
        bookId: mockAvailableBook.id,
      });

      expect(result.id).toBe('borrow-1');
      expect(prisma.book.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockAvailableBook.id, availableCopies: { gt: 0 } },
          data: { availableCopies: { decrement: 1 } },
        })
      );
    });

    it('should reject borrowing when member is inactive (MEMBER_INACTIVE)', async () => {
      prisma.member.findUnique.mockResolvedValue(mockInactiveMember);

      await expect(
        service.borrowBook({
          memberId: mockInactiveMember.id,
          bookId: mockAvailableBook.id,
        })
      ).rejects.toThrow(BusinessException);

      try {
        await service.borrowBook({
          memberId: mockInactiveMember.id,
          bookId: mockAvailableBook.id,
        });
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.MEMBER_INACTIVE);
      }
    });

    it('should reject borrowing when book is out of stock (BOOK_OUT_OF_STOCK)', async () => {
      prisma.member.findUnique.mockResolvedValue(mockActiveMember);
      prisma.book.findUnique.mockResolvedValue(mockOutOfStockBook);

      try {
        await service.borrowBook({
          memberId: mockActiveMember.id,
          bookId: mockOutOfStockBook.id,
        });
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.BOOK_OUT_OF_STOCK);
      }
    });

    it('should reject borrowing when member has reached active borrowing limit of 3 (BORROWING_LIMIT_REACHED)', async () => {
      const memberWith3Loans = {
        ...mockActiveMember,
        borrowings: [
          { id: 'b1', status: BorrowingStatus.BORROWED, dueAt: new Date(Date.now() + 86400000) },
          { id: 'b2', status: BorrowingStatus.BORROWED, dueAt: new Date(Date.now() + 86400000) },
          { id: 'b3', status: BorrowingStatus.BORROWED, dueAt: new Date(Date.now() + 86400000) },
        ],
      };
      prisma.member.findUnique.mockResolvedValue(memberWith3Loans);

      try {
        await service.borrowBook({
          memberId: memberWith3Loans.id,
          bookId: mockAvailableBook.id,
        });
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.BORROWING_LIMIT_REACHED);
      }
    });

    it('should reject borrowing when member has an overdue book (OVERDUE_BORROWING_EXISTS)', async () => {
      const memberWithOverdue = {
        ...mockActiveMember,
        borrowings: [
          {
            id: 'b1',
            status: BorrowingStatus.BORROWED,
            dueAt: new Date(Date.now() - 5 * 86400000), // Due 5 days ago
          },
        ],
      };
      prisma.member.findUnique.mockResolvedValue(memberWithOverdue);

      try {
        await service.borrowBook({
          memberId: memberWithOverdue.id,
          bookId: mockAvailableBook.id,
        });
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.OVERDUE_BORROWING_EXISTS);
      }
    });
  });

  describe('Returning Business Rules', () => {
    it('should successfully return book on time without fine', async () => {
      const futureDue = new Date(Date.now() + 5 * 86400000);
      const borrowing = {
        id: 'loan-1',
        bookId: 'book-1',
        status: BorrowingStatus.BORROWED,
        dueAt: futureDue,
      };

      prisma.borrowing.findUnique.mockResolvedValue(borrowing);
      prisma.borrowing.update.mockResolvedValue({
        ...borrowing,
        status: BorrowingStatus.RETURNED,
        lateDays: 0,
        fineAmount: 0,
      });

      const result = await service.returnBook('loan-1');

      expect(result.lateDays).toBe(0);
      expect(result.fineAmount).toBe(0);
      expect(prisma.book.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'book-1' },
          data: { availableCopies: { increment: 1 } },
        })
      );
    });

    it('should calculate late days and daily fine correctly for late return', async () => {
      const pastDue = new Date(Date.now() - 3 * 86400000); // 3 days ago
      const borrowing = {
        id: 'loan-2',
        bookId: 'book-1',
        status: BorrowingStatus.BORROWED,
        dueAt: pastDue,
      };

      prisma.borrowing.findUnique.mockResolvedValue(borrowing);
      prisma.borrowing.update.mockImplementation(({ data }) => ({
        ...borrowing,
        ...data,
      }));

      const result = await service.returnBook('loan-2');

      expect(result.lateDays).toBe(3);
      expect(result.fineAmount).toBe(15000); // 3 * 5000
    });

    it('should reject returning an already returned borrowing (ALREADY_RETURNED)', async () => {
      const alreadyReturned = {
        id: 'loan-3',
        bookId: 'book-1',
        status: BorrowingStatus.RETURNED,
        dueAt: new Date(),
      };

      prisma.borrowing.findUnique.mockResolvedValue(alreadyReturned);

      try {
        await service.returnBook('loan-3');
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(ErrorCode.ALREADY_RETURNED);
      }
      expect(prisma.book.update).not.toHaveBeenCalled();
    });
  });
});
