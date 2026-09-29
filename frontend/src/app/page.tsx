'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ApiTester } from '@/components/ApiTester';
import {
  Zap,
  Shield,
  Layers,
  Cpu,
  ArrowRight,
  Database,
  KeyRound,
  CheckCircle,
  FileCode,
  Gauge,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const featuredCategories = [
    {
      name: 'Utility APIs',
      count: '4 APIs',
      desc: 'High-speed QR codes, IP insights, SHA cryptographic hashing, and health checks.',
      icon: Cpu,
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      name: 'Image Processing',
      count: '2 APIs',
      desc: 'Memory-safe streaming image resizer, metadata inspector, and WebP compression.',
      icon: Zap,
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      name: 'Media Services',
      count: '1 API',
      desc: 'Pooled remote HTTP inspections without downloading heavy file bodies.',
      icon: Layers,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Social Cards',
      count: '1 API',
      desc: 'OpenGraph, Twitter Cards, and meta tags extraction for rich previews.',
      icon: Sparkles,
      gradient: 'from-indigo-500 to-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5]">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-[#141414] py-20 lg:py-28">
          {/* Subtle gradient ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Version pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1A1A1A] bg-[#050505] px-3.5 py-1 text-xs text-[#A1A1AA] mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Orvia API Platform v1.0 Production Architecture</span>
            </div>

            {/* Official Brand Header */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Orvia"
                width={320}
                height={108}
                className="h-16 sm:h-20 w-auto object-contain"
                priority
              />
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
              One Centralized Engine for <br />
              <span className="text-gradient">High-Performance APIs</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
              Orvia brings together modern modular micro-services, distributed rate limiting,
              cryptographic API key authentication, and real-time request analytics into an AMOLED developer platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/apis"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
              >
                <span>Browse API Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-lg border border-[#222222] bg-[#080808] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#333333] hover:bg-[#121212]"
              >
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>Admin Console</span>
              </Link>
            </div>

            {/* Live Platform Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-4 text-center">
                <div className="text-2xl font-bold text-white">8+</div>
                <div className="text-xs text-[#71717A] mt-1">Modular APIs</div>
              </div>
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">&lt; 15ms</div>
                <div className="text-xs text-[#71717A] mt-1">Median Latency</div>
              </div>
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">99.99%</div>
                <div className="text-xs text-[#71717A] mt-1">Platform Uptime</div>
              </div>
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">PostgreSQL</div>
                <div className="text-xs text-[#71717A] mt-1">Neon Pooler v18</div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE PLAYGROUND SECTION */}
        <section className="border-b border-[#141414] py-16 bg-[#030303]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Live Interactive API Console
              </h2>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Test live endpoints directly against the backend. No setup required.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <ApiTester
                initialMethod="POST"
                initialEndpoint="/api/v1/utility/hash"
                defaultBody={{ text: "Orvia Platform 2026", algorithm: "sha256" }}
                requiresAuth={true}
              />
            </div>
          </div>
        </section>

        {/* API CATEGORIES SHOWCASE */}
        <section className="border-b border-[#141414] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Extensible Service Modules
                </h2>
                <p className="mt-2 text-sm text-[#A1A1AA]">
                  Adding new APIs requires simply dropping a new isolated directory into the architecture.
                </p>
              </div>
              <Link
                href="/apis"
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
              >
                <span>Explore all APIs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={idx}
                    className="group rounded-xl border border-[#141414] bg-[#050505] p-5 transition hover:border-[#282828] hover:bg-[#080808]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-cyan-400 group-hover:border-cyan-500/40 transition`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-[#121212] border border-[#222222] px-2.5 py-0.5 text-[11px] font-medium text-[#A1A1AA]">
                        {cat.count}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white">{cat.name}</h3>
                    <p className="mt-2 text-xs text-[#71717A] leading-relaxed">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRODUCTION ARCHITECTURE HIGHLIGHTS */}
        <section className="py-16 bg-[#030303]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Engineered for High Concurrency
              </h2>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Built from the ground up to prevent bottlenecks and scale independently.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-6">
                <Database className="h-6 w-6 text-cyan-400 mb-3" />
                <h3 className="text-base font-semibold text-white">Async PostgreSQL & Alembic</h3>
                <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                  SQLAlchemy 2.0 with native async psycopg 3 connection pooling. Indexed queries, relational constraints, and non-blocking background logging.
                </p>
              </div>

              <div className="rounded-xl border border-[#141414] bg-[#050505] p-6">
                <Gauge className="h-6 w-6 text-purple-400 mb-3" />
                <h3 className="text-base font-semibold text-white">Distributed Rate Limiting</h3>
                <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                  Sliding window token counter with Redis integration and memory-safe fallbacks. Returns standard HTTP 429 and rate limit headers.
                </p>
              </div>

              <div className="rounded-xl border border-[#141414] bg-[#050505] p-6">
                <KeyRound className="h-6 w-6 text-emerald-400 mb-3" />
                <h3 className="text-base font-semibold text-white">Hashed API Key System</h3>
                <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
                  Cryptographically secure token generation. Secrets are hashed with SHA-256 before storage so raw keys are never stored in plain text.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
