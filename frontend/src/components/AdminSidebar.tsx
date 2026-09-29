'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Activity,
  AlertTriangle,
  KeyRound,
  Users,
  Gauge,
  BarChart3,
  HeartPulse,
  Settings,
  X,
  FileText,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'API MANAGEMENT',
      items: [
        { href: '/admin/apis', label: 'All APIs', icon: Layers },
        { href: '/admin/apis/add', label: 'Register API', icon: PlusCircle },
        { href: '/admin/api-test', label: 'API Tester', icon: Terminal },
      ],
    },
    {
      title: 'TRAFFIC & LOGS',
      items: [
        { href: '/admin/requests', label: 'Live Requests', icon: Activity },
        { href: '/admin/requests/failed', label: 'Failed Requests', icon: AlertTriangle },
      ],
    },
    {
      title: 'ACCESS & SECURITY',
      items: [
        { href: '/admin/api-keys', label: 'API Keys', icon: KeyRound },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/rate-limits', label: 'Rate Limits', icon: Gauge },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { href: '/admin/health', label: 'System Health', icon: HeartPulse },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#141414] bg-black transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#141414] px-5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Orvia"
              width={110}
              height={36}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="text-[#71717A] hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {navSections.map((sec, idx) => (
              <div key={idx}>
                <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-[#52525B]">
                  {sec.title}
                </div>
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#0F0F0F] text-white border border-[#222222]'
                            : 'text-[#A1A1AA] hover:bg-[#080808] hover:text-white border border-transparent'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 transition ${
                            isActive
                              ? 'text-cyan-400'
                              : 'text-[#71717A] group-hover:text-[#A1A1AA]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Platform Info */}
        <div className="border-t border-[#141414] p-3">
          <div className="flex items-center justify-between rounded-lg bg-[#050505] border border-[#141414] p-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-[11px] font-medium text-white">PostgreSQL Connected</div>
                <div className="text-[10px] text-[#71717A]">Neon Pooler v18.6</div>
              </div>
            </div>
            <Link
              href="/docs"
              className="text-[#71717A] hover:text-white"
              title="Documentation"
            >
              <FileText className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
