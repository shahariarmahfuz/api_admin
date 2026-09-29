'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { RequestLog } from '@/lib/types';
import { formatDate, getMethodBadgeClass } from '@/lib/utils';
import { AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function FailedRequestsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['failed-logs', page],
    queryFn: async () => {
      const res = await api.getLogs({
        page,
        page_size: 25,
        failed_only: true,
      });
      return res.data || { items: [], total: 0, total_pages: 1 };
    },
    refetchInterval: 5000,
  });

  const logs: RequestLog[] = data?.items || [];
  const totalPages: number = data?.total_pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span>Failed Requests</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Isolated feed of client 4xx errors, rate limits, and server exceptions.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-[#1A1A1A] bg-[#080808] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Fetching failed logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-emerald-400">
            ✓ No failed requests recorded. All API services operating smoothly!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Endpoint</th>
                  <th className="py-3 px-4 font-medium">Error Reason</th>
                  <th className="py-3 px-4 font-medium">Client IP</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#080808] transition">
                    <td className="py-3 px-4">
                      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400">
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-white text-xs">{log.endpoint}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-rose-300 font-mono text-[11px]">
                      {log.error_message || 'HTTP Client Error'}
                    </td>
                    <td className="py-3 px-4 text-[#71717A]">{log.client_ip || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-[#71717A]">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#141414] px-4 py-3 text-xs text-[#71717A]">
          <div>
            Page {page} of {totalPages} ({data?.total || 0} failed requests)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
