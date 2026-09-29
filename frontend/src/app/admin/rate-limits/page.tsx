'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ApiKey, ApiService } from '@/lib/types';
import { Gauge, KeyRound, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminRateLimitsPage() {
  const { data: keys = [] } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      const res = await api.getApiKeys();
      return (res.data || []) as ApiKey[];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await api.getServices();
      return (res.data || []) as ApiService[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#141414] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Gauge className="h-5 w-5 text-cyan-400" />
          <span>Rate Limit Architecture &amp; Policies</span>
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          High-performance token bucket &amp; sliding window quotas enforced at the gateway.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Default Key Limit</span>
          <div className="mt-2 text-2xl font-bold text-white">60 req/min</div>
          <div className="mt-1 text-[11px] text-[#A1A1AA]">Standard baseline tier</div>
        </div>

        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Burst Tolerance Window</span>
          <div className="mt-2 text-2xl font-bold text-cyan-400">60 Seconds</div>
          <div className="mt-1 text-[11px] text-[#A1A1AA]">Sliding window precision</div>
        </div>

        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Rejection Response</span>
          <div className="mt-2 text-2xl font-bold text-rose-400">HTTP 429</div>
          <div className="mt-1 text-[11px] text-[#A1A1AA]">With Retry-After header</div>
        </div>
      </div>

      {/* Active Key Limits Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <span>Assigned API Key Quotas</span>
          </h3>
          <Link href="/admin/api-keys" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <span>Manage Keys</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#141414] text-[#71717A]">
                <th className="pb-3 font-medium">Key Prefix</th>
                <th className="pb-3 font-medium">Owner / Label</th>
                <th className="pb-3 font-medium">Per Minute Quota</th>
                <th className="pb-3 font-medium">Daily Quota</th>
                <th className="pb-3 font-medium">Enforcement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-[#080808] transition">
                  <td className="py-3 font-mono text-white">{k.key_prefix}••••</td>
                  <td className="py-3 font-medium text-white">{k.name}</td>
                  <td className="py-3 font-mono text-cyan-400 font-semibold">{k.rate_limit_per_minute} req/min</td>
                  <td className="py-3 font-mono text-white">{k.rate_limit_per_day} req/day</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active Filter
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Endpoint Level Limits Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <span>Endpoint Baseline Limits</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#141414] text-[#71717A]">
                <th className="pb-3 font-medium">Service</th>
                <th className="pb-3 font-medium">Endpoint</th>
                <th className="pb-3 font-medium">Default Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-[#080808] transition">
                  <td className="py-3 font-medium text-white">{s.name}</td>
                  <td className="py-3 font-mono text-[#A1A1AA]">{s.endpoint}</td>
                  <td className="py-3 font-mono text-white">{s.rate_limit_per_minute} req/min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
