import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose';
  trend?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-zinc-500">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

