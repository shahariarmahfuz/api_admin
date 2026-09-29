'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { RequestLog } from '@/lib/types';
import { formatDate, getMethodBadgeClass } from '@/lib/utils';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminRequestsPage() {
  const [page, setPage] = useState(1);
  const [endpointSearch, setEndpointSearch] = useState('');
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', page, endpointSearch, statusCodeFilter],
    queryFn: async () => {
      const res = await api.getLogs({
        page,
        page_size: 25,
        endpoint: endpointSearch || undefined,
        status_code: statusCodeFilter !== 'all' ? parseInt(statusCodeFilter) : undefined,
      });
      return res.data || { items: [], total: 0, total_pages: 1 };
    },
    refetchInterval: autoRefresh ? 4000 : false,
  });

  const logs: RequestLog[] = data?.items || [];
  const totalPages: number = data?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Requests &amp; Logs</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Streaming inspection of incoming HTTP API calls, client networks, and latencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              autoRefresh
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                : 'border-[#1A1A1A] bg-[#080808] text-[#71717A]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? 'bg-cyan-400 animate-pulse' : 'bg-[#52525B]'}`} />
            <span>Auto Refresh (4s)</span>
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A1A1A] bg-[#080808] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Fetch Now</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-2">
          <select
            value={statusCodeFilter}
            onChange={(e) => {
              setStatusCodeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[#1A1A1A] bg-[#050505] px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="404">404 Not Found</option>
            <option value="429">429 Rate Limited</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#52525B]" />
          <input
            type="text"
            placeholder="Search endpoint path..."
            value={endpointSearch}
            onChange={(e) => {
              setEndpointSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Fetching request logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Endpoint</th>
                  <th className="py-3 px-4 font-medium">Latency</th>
                  <th className="py-3 px-4 font-medium">Client IP</th>
                  <th className="py-3 px-4 font-medium">Request ID</th>
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#080808] transition">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
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
                    <td className="py-3 px-4">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-white text-xs">{log.endpoint}</td>
                    <td className="py-3 px-4 font-mono text-[#71717A]">{log.response_time_ms}ms</td>
                    <td className="py-3 px-4 text-[#71717A]">{log.client_ip || '127.0.0.1'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#52525B]">
                      {log.request_id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-[#71717A]">{formatDate(log.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-white"
                        title="View Full Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#141414] px-4 py-3 text-xs text-[#71717A]">
          <div>
            Page {page} of {totalPages} ({data?.total || 0} total requests)
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1A1A1A] bg-[#050505] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className={`rounded border px-2 py-0.5 text-xs font-bold ${getMethodBadgeClass(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <span className="font-mono text-sm text-white font-semibold">
                  {selectedLog.endpoint}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#71717A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Status Code:</span>
                <span className={selectedLog.status_code >= 400 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedLog.status_code}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Response Time:</span>
                <span className="text-white">{selectedLog.response_time_ms} ms</span>
              </div>
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Request ID:</span>
                <span className="text-white break-all">{selectedLog.request_id}</span>
              </div>
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Client IP:</span>
                <span className="text-white">{selectedLog.client_ip || 'None'}</span>
              </div>
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">API Key ID:</span>
                <span className="text-[#A1A1AA]">{selectedLog.api_key_id || 'Public / Unauthenticated'}</span>
              </div>
              <div className="flex justify-between border-b border-[#101010] pb-2">
                <span className="text-[#71717A]">Timestamp:</span>
                <span className="text-white">{formatDate(selectedLog.created_at)}</span>
              </div>

              {selectedLog.error_message && (
                <div className="pt-2">
                  <span className="text-rose-400 font-semibold block mb-1">Error Information:</span>
                  <pre className="rounded bg-black p-3 text-rose-300 text-xs overflow-x-auto border border-rose-500/20">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 text-xs font-medium text-white hover:bg-[#121212]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
