import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'BETA':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'MAINTENANCE':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'INACTIVE':
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

export function getMethodBadgeClass(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    case 'POST':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'PATCH':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'DELETE':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default:
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
}
