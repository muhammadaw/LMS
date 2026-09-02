'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/features/books/api';
import { CreateBookInput } from '@lms/types';
import { Alert } from '@/components/ui/Alert';
import { useForm } from 'react-hook-form';
import { BookPlus, ArrowLeft, BookOpen, Layers, Hash, Calendar, Library } from 'lucide-react';

export default function NewBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookInput>({
    defaultValues: {
      totalCopies: 1,
      publishedYear: new Date().getFullYear(),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBookInput) => booksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book-categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      router.push('/books');
    },
    onError: (err: any) => {
      setErrorMsg(err.error?.message || 'Failed to add book to catalog.');
    },
  });

  const onSubmit = (formData: CreateBookInput) => {
    formData.publishedYear = Number(formData.publishedYear);
    formData.totalCopies = Number(formData.totalCopies);
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Books
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          New Book
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Add a title to the catalog.
        </p>
      </div>

      {errorMsg && (
        <Alert
          type="error"
          title="Error"
          message={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Title
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Designing Data-Intensive Applications"
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
          />
          {errors.title && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Author
            </label>
            <input
              {...register('author', { required: 'Author is required' })}
              placeholder="e.g. Martin Kleppmann"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              ISBN
            </label>
            <input
              {...register('isbn', { required: 'ISBN is required' })}
              placeholder="e.g. 978-1449373320"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Publisher
            </label>
            <input
              {...register('publisher', { required: 'Publisher is required' })}
              placeholder="e.g. O'Reilly Media"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Category
            </label>
            <input
              {...register('category', { required: 'Category is required' })}
              placeholder="e.g. Technology"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Published Year
            </label>
            <input
              type="number"
              min="1000"
              max={new Date().getFullYear() + 1}
              {...register('publishedYear', { required: 'Year is required' })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Total Copies
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              {...register('totalCopies', { required: 'Total copies required' })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Link
            href="/books"
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
}
