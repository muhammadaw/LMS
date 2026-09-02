'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { borrowingsApi } from '@/features/borrowings/api';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  BookOpen,
  Users,
  BookmarkCheck,
  AlertOctagon,
  ArrowUpRight,
  BookmarkPlus,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => borrowingsApi.getDashboard(),
  });

  const metrics = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Overview of catalog inventory and active circulation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/borrowings/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Issue Loan
          </Link>
          <Link
            href="/returns"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Return Book
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Books"
          value={isLoading ? '...' : metrics?.totalBooks ?? 0}
          subtitle="Physical catalog items"
          icon={BookOpen}
        />
        <StatCard
          title="Active Members"
          value={isLoading ? '...' : metrics?.activeMembers ?? 0}
          subtitle="Registered patrons"
          icon={Users}
        />
        <StatCard
          title="Active Loans"
          value={isLoading ? '...' : metrics?.activeLoans ?? 0}
          subtitle="Currently on loan"
          icon={BookmarkCheck}
        />
        <StatCard
          title="Overdue"
          value={isLoading ? '...' : metrics?.overdueLoans ?? 0}
          subtitle="Late returns"
          icon={AlertOctagon}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-900">
            Recent Transactions
          </h2>
          <Link
            href="/transactions"
            className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-44 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))
          ) : !metrics?.recentTransactions?.length ? (
            <div className="p-10 text-center text-zinc-400 text-xs">
              No transactions yet.
            </div>
          ) : (
            metrics.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50/70 transition"
              >
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">
                    {tx.book?.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {tx.member?.name} ({tx.member?.memberNumber}) • Due{' '}
                    {format(new Date(tx.dueAt), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {tx.status === 'BORROWED' && (
                    <Badge variant="warning">On Loan</Badge>
                  )}
                  {tx.status === 'RETURNED' && (
                    <Badge variant="success">Returned</Badge>
                  )}
                  {tx.status === 'OVERDUE' && (
                    <Badge variant="danger">Overdue</Badge>
                  )}

                  {tx.fineAmount > 0 && (
                    <span className="text-xs font-semibold text-rose-600">
                      {formatCurrency(tx.fineAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
