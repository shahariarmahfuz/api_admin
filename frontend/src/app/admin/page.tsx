'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardStats, RequestLog } from '@/lib/types';
import { formatNumber, formatRelativeTime, getMethodBadgeClass } from '@/lib/utils';
import {
  Activity,
  Zap,
  KeyRound,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Server,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  // Fetch Overview Stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.getDashboardStats();
      return (res.data || {
        total_requests: 0,
        requests_today: 0,
        successful_requests: 0,
        failed_requests: 0,
        error_rate_percentage: 0.0,
        average_response_time_ms: 0.0,
        active_api_keys: 0,
        active_apis: 0,
        system_status: 'OPERATIONAL',
      }) as DashboardStats;
    },
    refetchInterval: 10000,
  });

  // Fetch Recent Requests
  const { data: recentLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: async () => {
      const res = await api.getLogs({ page: 1, page_size: 10 });
      return (res.data?.items || []) as RequestLog[];
    },
    refetchInterval: 10000,
  });

  // Fetch Top Endpoints
  const { data: topEndpoints = [] } = useQuery({
    queryKey: ['top-endpoints'],
    queryFn: async () => {
      const res = await api.getTopEndpoints();
      return res.data || [];
    },
    refetchInterval: 15000,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Dashboard</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Real-time traffic throughput, service availability, and response telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A1A1A] bg-[#080808] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white hover:border-[#282828] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/apis/add"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition shadow-sm"
          >
            <span>+ Add New API</span>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS (8 Key Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Total Requests</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {statsLoading ? '...' : formatNumber(stats?.total_requests || 0)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#A1A1AA]">
            <span>Today:</span>
            <span className="font-semibold text-white">{stats?.requests_today || 0}</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Avg Response Time</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {statsLoading ? '...' : `${stats?.average_response_time_ms || 0}ms`}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Ultra-low latency async engine</span>
          </div>
        </div>

        {/* Success Rate / Error Rate */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-400">
            {statsLoading
              ? '...'
              : `${(100 - (stats?.error_rate_percentage || 0)).toFixed(1)}%`}
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            <span>Failed: {stats?.failed_requests || 0}</span>
            <span className="mx-1">•</span>
            <span>Error: {stats?.error_rate_percentage || 0}%</span>
          </div>
        </div>

        {/* Active Keys & APIs */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A]">Active APIs &amp; Keys</span>
            <KeyRound className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {statsLoading ? '...' : `${stats?.active_apis || 0} / ${stats?.active_api_keys || 0}`}
          </div>
          <div className="mt-1 text-[11px] text-[#71717A]">
            <span>APIs in catalog / Issued keys</span>
          </div>
        </div>
      </div>

      {/* Two-Column: Top Endpoints & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Endpoints */}
        <div className="lg:col-span-7 rounded-xl border border-[#141414] bg-[#050505] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Traffic by Endpoint
            </h3>
            <Link
              href="/admin/analytics"
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {topEndpoints.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#71717A]">No endpoint traffic recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topEndpoints.slice(0, 5).map((ep: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[#141414] bg-[#0A0A0A] p-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-white truncate text-xs">{ep.endpoint}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-[#A1A1AA]">{ep.total_calls} calls</span>
                    <span className="font-mono text-[#71717A]">{ep.avg_latency_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick System Architecture Card */}
        <div className="lg:col-span-5 rounded-xl border border-[#141414] bg-[#050505] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Infrastructure Diagnostics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Primary Database</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  PostgreSQL Neon (Pooled)
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Async Driver</span>
                <span className="font-mono text-white">psycopg 3.3.6 (asyncio)</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Rate Limit Engine</span>
                <span className="font-mono text-cyan-400">Sliding Window Counter</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Schema Versioning</span>
                <span className="font-mono text-white">Alembic Migration Applied</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#141414]">
            <Link
              href="/admin/health"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#222222] bg-[#0A0A0A] py-2 text-xs font-medium text-white hover:border-[#333333] transition"
            >
              <Server className="h-3.5 w-3.5 text-cyan-400" />
              <span>View System Health &amp; Diagnostics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT REQUESTS STREAM */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Recent Requests
            </h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Live incoming traffic stream captured by async logging middleware
            </p>
          </div>
          <Link
            href="/admin/requests"
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>View All Requests</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {logsLoading ? (
          <div className="h-32 rounded-lg bg-[#0A0A0A] animate-pulse" />
        ) : recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#71717A]">No requests logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] text-[#71717A]">
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Method</th>
                  <th className="pb-2.5 font-medium">Endpoint</th>
                  <th className="pb-2.5 font-medium">Latency</th>
                  <th className="pb-2.5 font-medium">Client IP</th>
                  <th className="pb-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0A0A0A] transition">
                    <td className="py-2.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          log.status_code >= 200 && log.status_code < 300
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : log.status_code >= 400
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-white text-xs">{log.endpoint}</td>
                    <td className="py-2.5 font-mono text-[#71717A]">{log.response_time_ms}ms</td>
                    <td className="py-2.5 text-[#71717A]">{log.client_ip || '127.0.0.1'}</td>
                    <td className="py-2.5 text-[#71717A]">{formatRelativeTime(log.created_at)}</td>
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
