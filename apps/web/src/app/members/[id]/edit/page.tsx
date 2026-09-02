'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/features/members/api';
import { CreateMemberInput, MemberStatus } from '@lms/types';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, User, Mail, Phone, Hash, UserCheck } from 'lucide-react';

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => membersApi.getById(memberId),
    enabled: !!memberId,
  });

  const member = data?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateMemberInput>();

  useEffect(() => {
    if (member) {
      setValue('name', member.name);
      setValue('memberNumber', member.memberNumber);
      setValue('email', member.email);
      setValue('phone', member.phone ?? '');
      setValue('status', member.status);
    }
  }, [member, setValue]);

  const updateMutation = useMutation({
    mutationFn: (formData: Partial<CreateMemberInput>) =>
      membersApi.update(memberId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      router.push('/members');
    },
    onError: (err: any) => {
      setErrorMsg(err.error?.message || 'Failed to update member profile.');
    },
  });

  const onSubmit = (formData: CreateMemberInput) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-slate-400 text-sm">
        Loading member record...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Members
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Edit Member
          </h1>
          {member && (
            <div className="flex items-center gap-1.5">
              <Badge variant="neutral">{member.memberNumber}</Badge>
              {member.status === 'ACTIVE' ? (
                <Badge variant="success">ACTIVE</Badge>
              ) : (
                <Badge variant="danger">INACTIVE</Badge>
              )}
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
            Full Name
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Member ID
            </label>
            <input
              {...register('memberNumber', { required: 'Member number required' })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition font-mono"
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
              {...register('email', { required: 'Email required' })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Phone
            </label>
            <input
              {...register('phone', { required: 'Phone required' })}
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
