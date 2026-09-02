'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/features/books/api';
import { CreateBookInput } from '@lms/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, BookOpen, Layers, Hash, Calendar, Library } from 'lucide-react';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => booksApi.getById(bookId),
    enabled: !!bookId,
  });

  const book = data?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateBookInput>();

  useEffect(() => {
    if (book) {
      setValue('title', book.title);
      setValue('author', book.author);
      setValue('isbn', book.isbn);
      setValue('publisher', book.publisher);
      setValue('publishedYear', book.publishedYear);
      setValue('category', book.category);
      setValue('totalCopies', book.totalCopies);
    }
  }, [book, setValue]);

  const updateMutation = useMutation({
    mutationFn: (formData: Partial<CreateBookInput>) =>
      booksApi.update(bookId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      router.push('/books');
    },
    onError: (err: any) => {
      setErrorMsg(err.error?.message || 'Failed to update book.');
    },
  });

  const onSubmit = (formData: CreateBookInput) => {
    formData.publishedYear = Number(formData.publishedYear);
    formData.totalCopies = Number(formData.totalCopies);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-slate-400 text-sm">
        Loading book metadata...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Books
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Edit Book
          </h1>
          {book && (
            <div className="flex items-center gap-1.5">
              <Badge variant="neutral">{book.isbn}</Badge>
              <Badge variant="neutral">{book.availableCopies} available</Badge>
            </div>
          )}
        </div>
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
            {...register('title', { required: 'Book title is required' })}
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Author
            </label>
            <input
              {...register('author', { required: 'Author is required' })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              ISBN
            </label>
            <input
              {...register('isbn', { required: 'ISBN is required' })}
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
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Category
            </label>
            <input
              {...register('category', { required: 'Category is required' })}
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
              {...register('publishedYear', { required: 'Year required' })}
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
              {...register('totalCopies', { required: 'Total copies count required' })}
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
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
