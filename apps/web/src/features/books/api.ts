import { apiClient } from '@/lib/api-client';
import { BookDto, CreateBookInput, UpdateBookInput, ApiResponse } from '@lms/types';

export const booksApi = {
  getAll: (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    apiClient.get<any, ApiResponse<BookDto[]>>('/books', { params }),

  getById: (id: string) =>
    apiClient.get<any, ApiResponse<BookDto>>(`/books/${id}`),

  getCategories: () =>
    apiClient.get<any, ApiResponse<string[]>>('/books/categories'),

  create: (data: CreateBookInput) =>
    apiClient.post<any, ApiResponse<BookDto>>('/books', data),

  update: (id: string, data: UpdateBookInput) =>
    apiClient.patch<any, ApiResponse<BookDto>>(`/books/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/books/${id}`),
};
