import Link from 'next/link';
import { BookmarkPlus, RotateCcw, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
        <span>Circulation Desk</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/borrowings/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Issue Loan</span>
        </Link>
        <Link
          href="/returns"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return</span>
        </Link>
      </div>
    </header>
  );
}

