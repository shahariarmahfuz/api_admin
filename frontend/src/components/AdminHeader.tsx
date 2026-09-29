'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, ExternalLink, User, ShieldCheck } from 'lucide-react';
import { getCurrentUserStored, removeAuthToken } from '@/lib/api-client';

interface AdminHeaderProps {
  onToggleMobile: () => void;
}

export function AdminHeader({ onToggleMobile }: AdminHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUserStored());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#141414] bg-black/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Toggle & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-md border border-[#1A1A1A] p-2 text-[#A1A1AA] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#1A1A1A] bg-[#050505] px-3 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#A1A1AA]">Status:</span>
          <span className="font-medium text-emerald-400">OPERATIONAL</span>
        </div>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#1A1A1A] bg-[#080808] px-3 py-1.5 text-xs text-[#A1A1AA] transition hover:border-[#282828] hover:text-white"
        >
          <span>View Public Site</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* User Card */}
        <div className="flex items-center gap-2 border-l border-[#1A1A1A] pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] border border-[#222222] text-xs font-semibold text-cyan-400">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="flex items-center gap-1 font-medium text-white">
              <span>{user?.full_name || 'Administrator'}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="text-[10px] text-[#71717A]">{user?.email || 'admin@orvia.dev'}</div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="ml-1 rounded-md p-1.5 text-[#71717A] hover:bg-[#141414] hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
