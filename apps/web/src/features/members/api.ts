import { apiClient } from '@/lib/api-client';
import {
  MemberDto,
  CreateMemberInput,
  UpdateMemberInput,
  MemberStatus,
  ApiResponse,
} from '@lms/types';

export const membersApi = {
  getAll: (params?: { search?: string; status?: MemberStatus; page?: number; limit?: number }) =>
    apiClient.get<any, ApiResponse<MemberDto[]>>('/members', { params }),

  getById: (id: string) =>
    apiClient.get<any, ApiResponse<MemberDto>>(`/members/${id}`),

  create: (data: CreateMemberInput) =>
    apiClient.post<any, ApiResponse<MemberDto>>('/members', data),

  update: (id: string, data: UpdateMemberInput) =>
    apiClient.patch<any, ApiResponse<MemberDto>>(`/members/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/members/${id}`),
};
