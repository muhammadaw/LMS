'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookmarkPlus,
  RotateCcw,
  History,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Books', href: '/books', icon: BookOpen },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Borrow', href: '/borrowings/new', icon: BookmarkPlus },
  { name: 'Returns', href: '/returns', icon: RotateCcw },
  { name: 'Transactions', href: '/transactions', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-100 gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
          <Library className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm text-zinc-900 tracking-tight">
          LibriFlow
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="px-2.5 pb-2 text-[11px] font-medium text-zinc-400 tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3.5 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Connected</span>
      </div>
    </aside>
  );
}
