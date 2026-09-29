'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Terminal, Shield, BookOpen, Layers, Menu, X, ArrowUpRight } from 'lucide-react';
import { getAuthToken } from '@/lib/api-client';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  const navLinks = [
    { href: '/apis', label: 'APIs', icon: Layers },
    { href: '/docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#141414] bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-90">
          <Image
            src="/logo.png"
            alt="Orvia"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'text-white bg-[#0A0A0A] border border-[#222222]'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#080808]'
                }`}
              >
                <Icon className="h-4 w-4 text-[#71717A]" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-[#1A1A1A] bg-[#050505] px-2.5 py-1 text-xs text-[#A1A1AA]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational</span>
          </div>

          {isLoggedIn ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md border border-[#222222] bg-[#0F0F0F] px-4 py-2 text-sm font-medium text-white transition hover:border-[#333333] hover:bg-[#181818]"
            >
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Dashboard</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#71717A]" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md border border-[#222222] bg-[#0F0F0F] px-4 py-2 text-sm font-medium text-white transition hover:border-[#333333] hover:bg-[#181818]"
            >
              <span>Sign In</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#71717A]" />
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex p-2 text-[#A1A1AA] hover:text-white md:hidden"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#1A1A1A] bg-black px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[#A1A1AA] hover:bg-[#0A0A0A] hover:text-white"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-[#1A1A1A]" />
            <Link
              href={isLoggedIn ? "/admin" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-md bg-[#121212] py-2.5 text-sm font-medium text-white border border-[#222222]"
            >
              {isLoggedIn ? "Go to Dashboard" : "Sign In to Console"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
