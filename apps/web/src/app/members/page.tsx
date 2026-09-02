'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/features/members/api';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MemberStatus } from '@lms/types';
import {
  Search,
  Plus,
  Users,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Mail,
  Phone,
  BookmarkPlus,
} from 'lucide-react';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('');
  const [page, setPage] = useState(1);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['members', { search, statusFilter, page }],
    queryFn: () =>
      membersApi.getAll({
        search: search || undefined,
        status: (statusFilter as MemberStatus) || undefined,
        page,
        limit: 8,
      }),
  });

  const members = data?.data || [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      alert(err.error?.message || 'Failed to delete member.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Members
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registered library patrons and circulation status.
          </p>
        </div>
        <Link
          href="/members/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          Enroll Member
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, ID, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-zinc-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as MemberStatus | '');
              setPage(1);
            }}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Loans</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={Users}
                      title="No members found"
                      description={
                        search || statusFilter
                          ? 'No patron matches your current search criteria.'
                          : 'No patrons are currently registered in the system.'
                      }
                      actionLabel={search || statusFilter ? 'Clear Search' : 'Enroll First Member'}
                      onAction={
                        search || statusFilter
                          ? () => {
                              setSearch('');
                              setStatusFilter('');
                            }
                          : undefined
                      }
                      actionHref={!search && !statusFilter ? '/members/new' : undefined}
                    />
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const loanCount = member.activeBorrowingsCount ?? 0;
                  const isLimitReached = loanCount >= 3;
                  const isEligible = member.status === 'ACTIVE' && !isLimitReached;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {member.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold">
                        {member.memberNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {member.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.status === 'ACTIVE' ? (
                          <Badge variant="success">ACTIVE</Badge>
                        ) : (
                          <Badge variant="danger">INACTIVE</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              isLimitReached
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : loanCount > 0
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {loanCount} / 3
                          </span>
                          {isLimitReached && (
                            <span className="text-[10px] font-bold text-rose-600">
                              (MAX)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {isEligible && (
                          <Link
                            href={`/borrowings/new?memberId=${member.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                            title="Issue loan for this member"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Issue Loan
                          </Link>
                        )}
                        <Link
                          href={`/members/${member.id}/edit`}
                          className="inline-flex items-center p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="inline-flex items-center p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {Boolean(meta?.totalPages && meta.totalPages > 1) && (
          <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Page {meta?.page ?? 1} of {meta?.totalPages ?? 1} ({meta?.total ?? 0} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={Boolean(meta?.totalPages && page >= meta.totalPages)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded-md border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Styled Delete Dialog */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            deleteMutation.mutate(memberToDelete.id);
            setMemberToDelete(null);
          }
        }}
        title="Delete Member"
        description={`Are you sure you want to delete "${memberToDelete?.name}"? Active loan records may prevent deletion.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
