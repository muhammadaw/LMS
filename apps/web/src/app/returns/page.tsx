'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowingsApi } from '@/features/borrowings/api';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

export default function ReturnsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [confirmLoan, setConfirmLoan] = useState<any>(null);
  const [returnSuccess, setReturnSuccess] = useState<{
    bookTitle: string;
    memberName: string;
    lateDays: number;
    fineAmount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch only active loans (BORROWED or OVERDUE)
  const { data, isLoading } = useQuery({
    queryKey: ['active-borrowings'],
    queryFn: () => borrowingsApi.getAll({ limit: 100 }),
  });

  const activeLoans =
    data?.data?.filter((b) => b.status === 'BORROWED' || b.status === 'OVERDUE') ||
    [];

  const filteredLoans = activeLoans.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch =
      b.book?.title.toLowerCase().includes(term) ||
      b.member?.name.toLowerCase().includes(term) ||
      b.member?.memberNumber.toLowerCase().includes(term);

    const now = new Date();
    const dueDate = new Date(b.dueAt);
    const isLate = now > dueDate;

    if (filterOverdueOnly) {
      return matchesSearch && isLate;
    }
    return matchesSearch;
  });

  const overdueCount = activeLoans.filter(
    (b) => new Date() > new Date(b.dueAt)
  ).length;

  const returnMutation = useMutation({
    mutationFn: (id: string) => borrowingsApi.returnBook(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['active-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      const returnedLoan = res.data?.borrowing;
      setReturnSuccess({
        bookTitle: returnedLoan?.book?.title || 'Book',
        memberName: returnedLoan?.member?.name || 'Member',
        lateDays: res.data?.lateDays || 0,
        fineAmount: res.data?.fineAmount || 0,
      });
      setConfirmLoan(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.error?.message || 'Failed to process return.');
      setConfirmLoan(null);
      setReturnSuccess(null);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          Returns
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Process returned books and assess overdue fines.
        </p>
      </div>

      {returnSuccess && (
        <Alert
          type="success"
          title="Returned"
          message={`"${returnSuccess.bookTitle}" returned by ${returnSuccess.memberName}. Late days: ${returnSuccess.lateDays}. Fine: ${formatCurrency(returnSuccess.fineAmount)}.`}
          onClose={() => setReturnSuccess(null)}
        />
      )}

      {errorMsg && (
        <Alert
          type="error"
          title="Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      {/* Control Tabs & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search book or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterOverdueOnly(false)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              !filterOverdueOnly
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            All Active ({activeLoans.length})
          </button>
          <button
            onClick={() => setFilterOverdueOnly(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
              filterOverdueOnly
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <span>Overdue</span>
            {overdueCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                filterOverdueOnly ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
              }`}>
                {overdueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Loans Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Borrower</th>
                <th className="px-5 py-3">Loan Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-5 py-3 text-right"><Skeleton className="h-7 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={CheckCircle2}
                      title="No pending returns"
                      description={
                        search || filterOverdueOnly
                          ? 'No active loans match your filter.'
                          : 'All borrowed books have been checked in.'
                      }
                      actionLabel={filterOverdueOnly ? 'Show All Active' : undefined}
                      onAction={filterOverdueOnly ? () => setFilterOverdueOnly(false) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const now = new Date();
                  const dueDate = new Date(loan.dueAt);
                  const isLate = now > dueDate;
                  const estimatedLateDays = isLate
                    ? differenceInCalendarDays(now, dueDate)
                    : 0;
                  const estimatedFine = estimatedLateDays * 5000;

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-zinc-50/70 transition"
                    >
                      <td className="px-5 py-3">
                        <div className="font-semibold text-zinc-900">
                          {loan.book?.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {loan.book?.author}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-zinc-800">
                          {loan.member?.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {loan.member?.memberNumber}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">
                        {format(new Date(loan.borrowedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-5 py-3 text-zinc-700 font-medium">
                        {format(dueDate, 'MMM dd, yyyy')}
                      </td>
                      <td className="px-5 py-3">
                        {isLate ? (
                          <div>
                            <Badge variant="danger">
                              Overdue ({estimatedLateDays}d)
                            </Badge>
                            <div className="text-[11px] font-semibold text-rose-600 mt-0.5">
                              Fine: {formatCurrency(estimatedFine)}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="success">On Time</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setConfirmLoan(loan)}
                          disabled={returnMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Check In
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Styled Dialog instead of browser confirm() */}
      <ConfirmDialog
        isOpen={!!confirmLoan}
        onClose={() => setConfirmLoan(null)}
        onConfirm={() => {
          if (confirmLoan) {
            returnMutation.mutate(confirmLoan.id);
          }
        }}
        title="Confirm Return"
        description={`Check in "${confirmLoan?.book?.title}" from member ${confirmLoan?.member?.name}?`}
        confirmLabel="Confirm Return"
        isLoading={returnMutation.isPending}
      />
    </div>
  );
}
