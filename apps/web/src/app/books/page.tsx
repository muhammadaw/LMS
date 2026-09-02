'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/features/books/api';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
} from 'lucide-react';

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [bookToDelete, setBookToDelete] = useState<any>(null);

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['book-categories'],
    queryFn: () => booksApi.getCategories(),
  });

  // Fetch Books
  const { data, isLoading } = useQuery({
    queryKey: ['books', { search, category, page }],
    queryFn: () =>
      booksApi.getAll({
        search: search || undefined,
        category: category || undefined,
        page,
        limit: 8,
      }),
  });

  const books = data?.data || [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => booksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      alert(err.error?.message || 'Failed to delete book.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Books
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage titles and copy availability.
          </p>
        </div>
        <Link
          href="/books/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Book
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, author, ISBN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-zinc-500">Category:</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
          >
            <option value="">All Categories</option>
            {catData?.data?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">ISBN</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Year</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-44 mb-1.5" />
                      <Skeleton className="h-3 w-28" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={BookOpen}
                      title="No books cataloged"
                      description={
                        search || category
                          ? 'No titles match your query. Try resetting filters.'
                          : 'Begin by adding the first book to the library catalog.'
                      }
                      actionLabel={search || category ? 'Clear Filters' : 'Add First Book'}
                      onAction={
                        search || category
                          ? () => {
                              setSearch('');
                              setCategory('');
                            }
                          : undefined
                      }
                      actionHref={!search && !category ? '/books/new' : undefined}
                    />
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {book.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{book.author} • {book.publisher}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 font-medium">
                      {book.isbn}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{book.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {book.publishedYear}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {book.availableCopies === 0 ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : book.availableCopies <= 2 ? (
                          <Badge variant="warning">
                            {book.availableCopies} of {book.totalCopies} left
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            {book.availableCopies} of {book.totalCopies} available
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {book.availableCopies > 0 && (
                        <Link
                          href={`/borrowings/new?bookId=${book.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          title="Issue loan for this book"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Loan
                        </Link>
                      )}
                      <Link
                        href={`/books/${book.id}/edit`}
                        className="inline-flex items-center p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
                        title="Edit Book Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setBookToDelete(book)}
                        className="inline-flex items-center p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Book"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar with Safe Optionality */}
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
        isOpen={!!bookToDelete}
        onClose={() => setBookToDelete(null)}
        onConfirm={() => {
          if (bookToDelete) {
            deleteMutation.mutate(bookToDelete.id);
            setBookToDelete(null);
          }
        }}
        title="Delete Book"
        description={`Are you sure you want to delete "${bookToDelete?.title}"? Active loans may prevent this deletion.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
