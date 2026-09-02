import { apiClient } from '@/lib/api-client';
import {
  BorrowingDto,
  CreateBorrowingInput,
  ReturnBorrowingResult,
  BorrowingStatus,
  ApiResponse,
} from '@lms/types';

export const borrowingsApi = {
  getAll: (params?: {
    memberId?: string;
    bookId?: string;
    status?: BorrowingStatus;
    page?: number;
    limit?: number;
  }) => apiClient.get<any, ApiResponse<BorrowingDto[]>>('/borrowings', { params }),

  getById: (id: string) =>
    apiClient.get<any, ApiResponse<BorrowingDto>>(`/borrowings/${id}`),

  borrow: (data: CreateBorrowingInput) =>
    apiClient.post<any, ApiResponse<BorrowingDto>>('/borrowings', data),

  returnBook: (id: string) =>
    apiClient.post<any, ApiResponse<ReturnBorrowingResult>>(
      `/borrowings/${id}/return`
    ),

  getDashboard: () =>
    apiClient.get<any, ApiResponse<{
      totalBooks: number;
      activeMembers: number;
      activeLoans: number;
      overdueLoans: number;
      recentTransactions: BorrowingDto[];
    }>>('/borrowings/dashboard'),
};
