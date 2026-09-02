'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { borrowingsApi } from '@/features/borrowings/api';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { BorrowingStatus } from '@lms/types';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<BorrowingStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { statusFilter, page }],
    queryFn: () =>
      borrowingsApi.getAll({
        status: (statusFilter as BorrowingStatus) || undefined,
        page,
        limit: 10,
      }),
  });

  const transactions = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          Transactions
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Audit log of all book loans and returns.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as BorrowingStatus | '');
              setPage(1);
            }}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
          >
            <option value="">All</option>
            <option value="BORROWED">On Loan</option>
            <option value="RETURNED">Returned</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <span className="text-xs text-zinc-400">
          Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Loan Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Returned</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      icon={History}
                      title="No transaction records found"
                      description={
                        statusFilter
                          ? 'No borrowing transactions match the selected status filter.'
                          : 'Circulation activity will appear here as books are loaned out and returned.'
                      }
                      actionLabel={statusFilter ? 'Clear Status Filter' : undefined}
                      onAction={statusFilter ? () => setStatusFilter('') : undefined}
                    />
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{tx.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {tx.book?.title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ISBN: {tx.book?.isbn}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {tx.member?.name}
                      </div>
                      <div className="text-xs font-mono text-indigo-600">
                        {tx.member?.memberNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {format(new Date(tx.borrowedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-semibold">
                      {format(new Date(tx.dueAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {tx.returnedAt ? (
                        format(new Date(tx.returnedAt), 'MMM dd, yyyy')
                      ) : (
                        <span className="text-slate-400 italic">Not returned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === 'BORROWED' && (
                        <Badge variant="warning">On Loan</Badge>
                      )}
                      {tx.status === 'RETURNED' && (
                        <Badge variant="success">Returned</Badge>
                      )}
                      {tx.status === 'OVERDUE' && (
                        <Badge variant="danger">Overdue</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {tx.fineAmount > 0 ? (
                        <span className="font-bold text-xs text-rose-600">
                          {formatCurrency(tx.fineAmount)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Rp 0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination with safe optional checks */}
        {Boolean(meta?.totalPages && meta.totalPages > 1) && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page <strong className="text-slate-800">{meta?.page ?? 1}</strong> of{' '}
              <strong className="text-slate-800">{meta?.totalPages ?? 1}</strong> ({meta?.total ?? 0} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={Boolean(meta?.totalPages && page >= meta.totalPages)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
