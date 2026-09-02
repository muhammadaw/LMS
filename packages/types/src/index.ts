export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export const MemberStatus = {
  ACTIVE: 'ACTIVE' as MemberStatus,
  INACTIVE: 'INACTIVE' as MemberStatus,
};

export type BorrowingStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE';
export const BorrowingStatus = {
  BORROWED: 'BORROWED' as BorrowingStatus,
  RETURNED: 'RETURNED' as BorrowingStatus,
  OVERDUE: 'OVERDUE' as BorrowingStatus,
};

export interface BookDto {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishedYear: number;
  category: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateBookInput {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishedYear: number;
  category: string;
  totalCopies: number;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {}

export interface MemberDto {
  id: string;
  name: string;
  memberNumber: string;
  email: string;
  phone?: string | null;
  status: MemberStatus;
  activeBorrowingsCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateMemberInput {
  name: string;
  memberNumber?: string;
  email: string;
  phone?: string;
  status?: MemberStatus;
}

export interface UpdateMemberInput extends Partial<CreateMemberInput> {}

export interface BorrowingDto {
  id: string;
  memberId: string;
  bookId: string;
  borrowedAt: string | Date;
  dueAt: string | Date;
  returnedAt?: string | Date | null;
  status: BorrowingStatus;
  lateDays: number;
  fineAmount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  member?: MemberDto;
  book?: BookDto;
}

export interface CreateBorrowingInput {
  memberId: string;
  bookId: string;
  dueAt?: string;
}

export interface ReturnBorrowingResult {
  borrowing: BorrowingDto;
  lateDays: number;
  fineAmount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export enum ErrorCode {
  BOOK_OUT_OF_STOCK = 'BOOK_OUT_OF_STOCK',
  MEMBER_INACTIVE = 'MEMBER_INACTIVE',
  BORROWING_LIMIT_REACHED = 'BORROWING_LIMIT_REACHED',
  OVERDUE_BORROWING_EXISTS = 'OVERDUE_BORROWING_EXISTS',
  ALREADY_RETURNED = 'ALREADY_RETURNED',
  BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  BORROWING_NOT_FOUND = 'BORROWING_NOT_FOUND',
  DUPLICATE_ISBN = 'DUPLICATE_ISBN',
  DUPLICATE_MEMBER_NUMBER = 'DUPLICATE_MEMBER_NUMBER',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}
