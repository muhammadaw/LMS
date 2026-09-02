'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/features/books/api';
import { membersApi } from '@/features/members/api';
import { borrowingsApi } from '@/features/borrowings/api';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { CreateBorrowingInput } from '@lms/types';
import {
  BookmarkPlus,
  Calendar,
  User,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { addDays, format } from 'date-fns';

function BorrowPageContent() {
  const searchParams = useSearchParams();
  const initialBookId = searchParams.get('bookId') || '';
  const initialMemberId = searchParams.get('memberId') || '';

  const queryClient = useQueryClient();

  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
  const [loanDays, setLoanDays] = useState(14);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Sync if URL search params load asynchronously
  useEffect(() => {
    if (initialBookId && !selectedBookId) setSelectedBookId(initialBookId);
    if (initialMemberId && !selectedMemberId) setSelectedMemberId(initialMemberId);
  }, [initialBookId, initialMemberId, selectedBookId, selectedMemberId]);

  // Fetch active members
  const { data: membersData } = useQuery({
    queryKey: ['members-select'],
    queryFn: () => membersApi.getAll({ limit: 100 }),
  });

  // Fetch available books
  const { data: booksData } = useQuery({
    queryKey: ['books-select'],
    queryFn: () => booksApi.getAll({ limit: 100 }),
  });

  const members = membersData?.data || [];
  const books = booksData?.data || [];

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedBook = books.find((b) => b.id === selectedBookId);

  const dueDate = addDays(new Date(), loanDays);

  // Rule verification flags
  const isMemberInactive = selectedMember && selectedMember.status === 'INACTIVE';
  const isLimitReached = selectedMember && (selectedMember.activeBorrowingsCount ?? 0) >= 3;
  const isOutOfStock = selectedBook && selectedBook.availableCopies <= 0;

  const borrowMutation = useMutation({
    mutationFn: (input: CreateBorrowingInput) => borrowingsApi.borrow(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSuccessInfo(
        `Successfully issued "${data.data?.book?.title}" to ${data.data?.member?.name}. Due on ${format(
          new Date(data.data?.dueAt || dueDate),
          'EEEE, MMMM dd, yyyy'
        )}.`
      );
      setErrorDetails(null);
      setSelectedBookId('');
    },
    onError: (err: any) => {
      setErrorDetails({
        code: err.error?.code || 'RULE_VIOLATION',
        message: err.error?.message || 'Failed to borrow book.',
      });
      setSuccessInfo(null);
    },
  });

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedBookId) return;

    borrowMutation.mutate({
      memberId: selectedMemberId,
      bookId: selectedBookId,
      dueAt: dueDate.toISOString(),
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          Issue Loan
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Select a member and book to record a new borrowing.
        </p>
      </div>

      {successInfo && (
        <Alert
          type="success"
          title="Success"
          message={successInfo}
          onClose={() => setSuccessInfo(null)}
        />
      )}

      {errorDetails && (
        <Alert
          type="error"
          title="Cannot Issue Loan"
          message={errorDetails.message}
          onClose={() => setErrorDetails(null)}
        />
      )}

      <form
        onSubmit={handleBorrowSubmit}
        className="bg-white rounded-xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4"
      >
        {/* Step 1: Member Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Member
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              setErrorDetails(null);
            }}
            required
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:bg-white focus:outline-none transition"
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.memberNumber}) — {m.status} [{m.activeBorrowingsCount ?? 0}/3 loans]
              </option>
            ))}
          </select>

          {/* Member preview */}
          {selectedMember && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-900">{selectedMember.name}</span>
                <span className="text-zinc-500 ml-1.5 font-mono text-[11px]">{selectedMember.memberNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isMemberInactive ? (
                  <Badge variant="danger">INACTIVE</Badge>
                ) : (
                  <Badge variant="success">ACTIVE</Badge>
                )}
                <span className="text-zinc-500 font-medium text-[11px]">
                  {selectedMember.activeBorrowingsCount ?? 0}/3 loans
                </span>
              </div>
            </div>
          )}
          {isLimitReached && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              Member has reached the limit of 3 active loans.
            </p>
          )}
          {isMemberInactive && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              Member is inactive and cannot borrow books.
            </p>
          )}
        </div>

        {/* Step 2: Book Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Book
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => {
              setSelectedBookId(e.target.value);
              setErrorDetails(null);
            }}
            required
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:bg-white focus:outline-none transition"
          >
            <option value="">Select Book</option>
            {books.map((b) => (
              <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                {b.title} — {b.author} ({b.availableCopies} available)
              </option>
            ))}
          </select>

          {/* Book preview */}
          {selectedBook && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-zinc-900">{selectedBook.title}</span>
                <span className="text-zinc-500 ml-1.5 text-[11px]">{selectedBook.author}</span>
              </div>
              <div>
                {selectedBook.availableCopies <= 0 ? (
                  <Badge variant="danger">Out of stock</Badge>
                ) : (
                  <Badge variant="neutral">
                    {selectedBook.availableCopies} copies left
                  </Badge>
                )}
              </div>
            </div>
          )}
          {isOutOfStock && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              All copies are currently loaned out.
            </p>
          )}
        </div>

        {/* Step 3: Loan Period */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Duration (Days)
          </label>
          <div className="flex items-center gap-2">
            {[7, 14, 21, 30].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setLoanDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  loanDays === d
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {d}d
              </button>
            ))}
            <span className="text-xs text-zinc-400 ml-2">
              Due {format(dueDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={
              !selectedMemberId ||
              !selectedBookId ||
              isMemberInactive ||
              isLimitReached ||
              isOutOfStock ||
              borrowMutation.isPending
            }
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {borrowMutation.isPending ? 'Processing...' : 'Confirm Loan'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BorrowPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-slate-400 text-sm">Loading loan desk...</div>}>
      <BorrowPageContent />
    </Suspense>
  );
}
