'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  LogOut,
  ExternalLink,
  User,
  ShieldCheck,
  ChevronDown,
  Settings,
  Key,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import { api, getCurrentUserStored, removeAuthToken } from '@/lib/api-client';
import { ConfirmationModal } from '@/components/ConfirmationModal';

interface AdminHeaderProps {
  onToggleMobile: () => void;
}

export function AdminHeader({ onToggleMobile }: AdminHeaderProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [fallbackUser, setFallbackUser] = useState<any>(null);

  useEffect(() => {
    setFallbackUser(getCurrentUserStored());
  }, []);

  // Fetch live current user profile
  const { data: profileRes } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const res = await api.getMyProfile();
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const currentUser = profileRes || fallbackUser;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    removeAuthToken();
    setLogoutModalOpen(false);
    setMenuOpen(false);
    router.push('/login');
  };

  const displayName = currentUser?.full_name || 'Administrator';
  const displayEmail = currentUser?.email || 'admin@orvia.dev';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#141414] bg-black/90 px-4 backdrop-blur-md sm:px-6">
        {/* Left: Mobile Toggle & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="rounded-md border border-[#1A1A1A] p-2 text-[#A1A1AA] hover:text-white lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#1A1A1A] bg-[#050505] px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#A1A1AA]">Status:</span>
            <span className="font-medium text-emerald-400">OPERATIONAL</span>
          </div>
        </div>

        {/* Right: Public Site Link & User Profile Menu */}
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

          {/* Profile Popover Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] p-1.5 sm:px-2.5 sm:py-1.5 text-left text-xs transition hover:border-[#2A2A2A] hover:bg-[#121212]"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {/* Avatar Icon / Photo */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#222222] bg-[#141414] font-semibold text-cyan-400">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Name & Role (Hidden on mobile) */}
              <div className="hidden md:block">
                <div className="flex items-center gap-1 font-medium text-white leading-tight">
                  <span className="truncate max-w-[130px]">{displayName}</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[10px] text-[#71717A] truncate max-w-[140px]">
                  {displayEmail}
                </div>
              </div>

              <ChevronDown
                className={`h-3.5 w-3.5 text-[#71717A] transition-transform duration-200 ${
                  menuOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Profile Popover Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-[#222222] bg-[#0A0A0A] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Header Information Card */}
                <div className="rounded-lg border border-[#171717] bg-[#050505] p-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#262626] bg-[#161616] text-xs font-bold text-cyan-400">
                      {currentUser?.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-white text-xs truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-[#71717A] truncate">{displayEmail}</div>
                      <span className="inline-block mt-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
                        PLATFORM ADMIN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Menu Links */}
                <div className="space-y-0.5 text-xs text-[#D4D4D8]">
                  <Link
                    href="/admin/profile?tab=profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#141414] hover:text-white transition"
                  >
                    <User className="h-3.5 w-3.5 text-cyan-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/admin/profile?tab=account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#141414] hover:text-white transition"
                  >
                    <Settings className="h-3.5 w-3.5 text-[#A1A1AA]" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    href="/admin/profile?tab=security"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#141414] hover:text-white transition"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Security &amp; Sessions</span>
                  </Link>

                  <Link
                    href="/admin/profile?tab=password"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#141414] hover:text-white transition"
                  >
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    <span>Change Password</span>
                  </Link>
                </div>

                {/* Destructive Action Separator */}
                <div className="my-1.5 border-t border-[#181818]" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AMOLED Custom Confirmation Modal for Logout */}
      <ConfirmationModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Sign Out"
        description="Are you sure you want to end your administrator session? You will need to log back in with your credentials to access the console."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        variant="danger"
      />
    </>
  );
}
