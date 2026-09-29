'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { getMethodBadgeClass } from '@/lib/utils';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { data: topEndpoints = [] } = useQuery({
    queryKey: ['analytics-top-endpoints'],
    queryFn: async () => {
      const res = await api.getTopEndpoints();
      return res.data || [];
    },
  });

  const { data: statusDistribution = {} } = useQuery({
    queryKey: ['analytics-status-distribution'],
    queryFn: async () => {
      const res = await api.getStatusDistribution();
      return res.data || {};
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.getDashboardStats();
      return res.data;
    },
  });

  const totalCalls = Object.values(statusDistribution).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#141414] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          <span>API Usage &amp; Analytics</span>
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Detailed metrics on request distribution, endpoint throughput, and latency profiles.
        </p>
      </div>

      {/* Top 3 High Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Aggregated Requests</span>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.total_requests || 0}</div>
          <div className="mt-1 text-[11px] text-[#A1A1AA]">
            Across all micro-service modules
          </div>
        </div>

        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Mean Gateway Latency</span>
          <div className="mt-2 text-2xl font-bold text-purple-400">
            {stats?.average_response_time_ms || 0} ms
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Optimal latency envelope</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <span className="text-xs text-[#71717A] font-medium">Platform Error Rate</span>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats?.error_rate_percentage || 0}%
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            {stats?.failed_requests || 0} failed requests in history
          </div>
        </div>
      </div>

      {/* HTTP Status Code Distribution */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
          HTTP Response Status Code Breakdown
        </h3>

        {Object.keys(statusDistribution).length === 0 ? (
          <p className="text-xs text-[#71717A] py-6 text-center">No status code events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusDistribution).map(([code, count]: [string, any]) => {
              const codeNum = parseInt(code);
              const percentage = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;
              const colorClass =
                codeNum >= 200 && codeNum < 300
                  ? 'bg-emerald-500'
                  : codeNum >= 400 && codeNum < 500
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

              return (
                <div key={code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-bold text-white">HTTP {code}</span>
                    <span className="text-[#A1A1AA]">
                      {count} calls ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#111111] overflow-hidden">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Endpoint Traffic Performance Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
          Throughput &amp; Latency by API Route
        </h3>

        {topEndpoints.length === 0 ? (
          <p className="text-xs text-[#71717A] py-6 text-center">No endpoint telemetry recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] text-[#71717A]">
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Invocations</th>
                  <th className="pb-3 font-medium">Average Latency</th>
                  <th className="pb-3 font-medium">Error Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {topEndpoints.map((ep: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#080808] transition">
                    <td className="py-3">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(ep.method)}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-white text-xs">{ep.endpoint}</td>
                    <td className="py-3 font-semibold text-white">{ep.total_calls}</td>
                    <td className="py-3 font-mono text-[#71717A]">{ep.avg_latency_ms} ms</td>
                    <td className="py-3">
                      <span className={ep.error_count > 0 ? 'text-rose-400 font-semibold' : 'text-[#52525B]'}>
                        {ep.error_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
