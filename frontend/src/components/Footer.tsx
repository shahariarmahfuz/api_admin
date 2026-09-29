import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#141414] bg-black py-12 text-[#71717A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Orvia"
              width={100}
              height={32}
              className="h-6 w-auto object-contain opacity-80"
            />
            <span className="text-xs text-[#52525B]">|</span>
            <span className="text-xs text-[#71717A]">Production-Ready API Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#A1A1AA]">
            <Link href="/apis" className="transition hover:text-white">APIs</Link>
            <Link href="/docs" className="transition hover:text-white">Documentation</Link>
            <Link href="/admin" className="transition hover:text-white">Console</Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[#101010] pt-6 text-center text-xs text-[#52525B] sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Orvia. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Powered by High-Performance Async Architecture & PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
