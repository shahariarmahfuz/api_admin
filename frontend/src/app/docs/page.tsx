'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookOpen, KeyRound, Shield, Gauge, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black text-[#F5F5F5]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 border-b border-[#141414] pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <BookOpen className="h-4 w-4" />
            <span>Developer Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
            Orvia Platform Architecture &amp; Integration Guide
          </h1>
          <p className="mt-3 text-base text-[#A1A1AA] leading-relaxed max-w-3xl">
            Welcome to the official developer documentation for the Orvia API Platform. Build, connect, and scale your integrations with standardized JSON responses, high concurrency, and low latency.
          </p>
        </div>

        <div className="space-y-12">
          {/* 1. Base URL */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">1.</span> Base URLs &amp; Versioning
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              All production endpoints are versioned with the <code className="text-cyan-300 font-mono">/api/v1</code> prefix. Breaking changes will increment the major version prefix without disrupting existing integrations.
            </p>
            <div className="rounded-lg border border-[#1A1A1A] bg-[#050505] p-3 font-mono text-xs text-white">
              https://api.orvia.dev/api/v1/
            </div>
          </section>

          {/* 2. Authentication */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">2.</span> Authentication &amp; API Keys
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Authenticate your requests by supplying your secret API key in the <code className="text-cyan-300 font-mono">Authorization</code> header using the Bearer scheme, or via the <code className="text-cyan-300 font-mono">X-API-Key</code> header:
            </p>
            <div className="rounded-lg border border-[#1A1A1A] bg-[#050505] p-4 font-mono text-xs text-white space-y-2">
              <div className="text-[#71717A]"># Recommended Bearer token scheme:</div>
              <div>Authorization: Bearer orv_live_24dd2208_...</div>
              <div className="text-[#71717A] pt-2"># Alternative custom header:</div>
              <div>X-API-Key: orv_live_24dd2208_...</div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <strong className="font-semibold">Security Best Practice:</strong> Keep your API keys private. Never commit keys to public client-side bundles or version control repositories. Store them in secure environment variables.
              </div>
            </div>
          </section>

          {/* 3. Standard Response Format */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">3.</span> Standard API Response Envelopes
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              All Orvia APIs return a consistent top-level JSON structure. Every successful request returns <code className="text-emerald-400 font-mono">success: true</code> and a payload under <code className="text-white font-mono">data</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#1A1A1A] bg-[#050505] p-4">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Successful Response (HTTP 200)</span>
                </div>
                <pre className="font-mono text-xs text-[#F5F5F5] overflow-x-auto">
{`{
  "success": true,
  "data": {
    "status": "healthy"
  },
  "message": "Request completed successfully"
}`}
                </pre>
              </div>

              <div className="rounded-lg border border-[#1A1A1A] bg-[#050505] p-4">
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Error Response (HTTP 4xx / 5xx)</span>
                </div>
                <pre className="font-mono text-xs text-[#F5F5F5] overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters"
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* 4. Rate Limiting */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">4.</span> Rate Limiting &amp; Quotas
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Orvia implements a high-performance sliding window counter algorithm. Response headers include telemetry about your remaining quota:
            </p>

            <div className="rounded-lg border border-[#1A1A1A] bg-[#050505] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#141414] text-[#71717A]">
                    <th className="p-3 font-medium">Header</th>
                    <th className="p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                  <tr>
                    <td className="p-3 font-mono text-white">X-RateLimit-Limit</td>
                    <td className="p-3">The maximum number of requests allowed in the 60-second window.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-white">X-RateLimit-Remaining</td>
                    <td className="p-3">The number of requests remaining in the current window.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-white">X-RateLimit-Reset</td>
                    <td className="p-3">The number of seconds until the current rate limit window resets.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-white">Retry-After</td>
                    <td className="p-3">Included when limit is exceeded (<code className="text-rose-400 font-mono">HTTP 429</code>). Indicates seconds to wait.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Console CTA */}
        <div className="mt-16 rounded-xl border border-[#222222] bg-[#080808] p-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-bold text-white">Ready to manage your keys &amp; APIs?</h3>
            <p className="mt-1 text-xs text-[#71717A]">
              Log into the Orvia Console to create API keys, view live request logs, and monitor metrics.
            </p>
          </div>
          <Link
            href="/admin"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90"
          >
            <span>Launch Admin Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
