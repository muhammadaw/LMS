'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/features/members/api';
import { CreateMemberInput, MemberStatus } from '@lms/types';
import { Alert } from '@/components/ui/Alert';
import { useForm } from 'react-hook-form';
import { UserPlus, ArrowLeft, Mail, Phone, Hash, UserCheck } from 'lucide-react';

export default function NewMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMemberInput>({
    defaultValues: {
      status: 'ACTIVE' as MemberStatus,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMemberInput) => membersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      router.push('/members');
    },
    onError: (err: any) => {
      setErrorMsg(err.error?.message || 'Failed to register member.');
    },
  });

  const onSubmit = (formData: CreateMemberInput) => {
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Members
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          New Member
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Register a patron for borrowing.
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
            Full Name
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            placeholder="e.g. Alex Johnson"
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
          />
          {errors.name && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Member ID
            </label>
            <input
              {...register('memberNumber', { required: 'Member number is required' })}
              placeholder="e.g. M-1008"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Status
            </label>
            <select
              {...register('status', { required: true })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              {...register('email', { required: 'Valid email is required' })}
              placeholder="e.g. alex@university.edu"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Phone
            </label>
            <input
              {...register('phone', { required: 'Phone is required' })}
              placeholder="e.g. +62 812-3456-7890"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <Link
            href="/members"
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
}
