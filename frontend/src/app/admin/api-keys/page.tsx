'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ApiKey } from '@/lib/types';
import { formatDate, formatRelativeTime, formatNumber } from '@/lib/utils';
import {
  KeyRound,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Power,
  ShieldCheck,
  AlertTriangle,
  X,
  Clock,
  Activity,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function AdminApiKeysPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [keyCreatedResult, setKeyCreatedResult] = useState<any | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form State
  const [keyName, setKeyName] = useState('');
  const [rateLimitMin, setRateLimitMin] = useState(60);
  const [rateLimitDay, setRateLimitDay] = useState(10000);

  // Fetch API Keys
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => {
      const res = await api.getApiKeys();
      return (res.data || []) as ApiKey[];
    },
  });

  // Create Key Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.createApiKey({
        name: keyName,
        rate_limit_per_minute: rateLimitMin,
        rate_limit_per_day: rateLimitDay,
      });
      if (!res.success) throw new Error(res.error?.message || 'Failed to create key');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setCreateModalOpen(false);
      setKeyCreatedResult(data);
      setKeyName('');
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return api.updateApiKey(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
    },
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.revokeApiKey(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleCopySecret = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-400" />
            <span>API Key Management</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Issue cryptographically hashed keys, assign quotas, and monitor key-level usage.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">No API keys found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                  <th className="py-3 px-4 font-medium">Key Name</th>
                  <th className="py-3 px-4 font-medium">Key Prefix</th>
                  <th className="py-3 px-4 font-medium">Rate Limits</th>
                  <th className="py-3 px-4 font-medium">Requests</th>
                  <th className="py-3 px-4 font-medium">Last Used</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-[#080808] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{key.name}</div>
                      <div className="text-[10px] text-[#52525B]">Created {formatDate(key.created_at)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 rounded bg-black border border-[#1A1A1A] px-2 py-1 font-mono text-xs text-white">
                        <span>{key.key_prefix}••••••••</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-white text-xs">
                      <div>{key.rate_limit_per_minute}/min</div>
                      <div className="text-[10px] text-[#52525B]">{key.rate_limit_per_day}/day</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{formatNumber(key.request_count)}</span>
                      <span className="text-[#52525B] text-[10px]"> calls</span>
                    </td>
                    <td className="py-3 px-4 text-[#71717A] text-xs">
                      {key.last_used_at ? formatRelativeTime(key.last_used_at) : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          key.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${key.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        <span>{key.is_active ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleMutation.mutate({ id: key.id, is_active: !key.is_active })
                          }
                          title={key.is_active ? 'Disable Key' : 'Enable Key'}
                          className={`rounded p-1 text-[#71717A] hover:bg-[#141414] ${
                            key.is_active ? 'hover:text-amber-400' : 'hover:text-emerald-400'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setKeyToRevoke(key)}
                          title="Revoke Key Permanently"
                          className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE KEY MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1A1A1A] bg-[#050505] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <span>Create New API Key</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[#71717A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Key Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Cluster, Mobile Client"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A1A1AA] mb-1 font-medium">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={rateLimitMin}
                    onChange={(e) => setRateLimitMin(parseInt(e.target.value) || 60)}
                    className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A1A1AA] mb-1 font-medium">Daily Limit (req/day)</label>
                  <input
                    type="number"
                    min={10}
                    max={1000000}
                    value={rateLimitDay}
                    onChange={(e) => setRateLimitDay(parseInt(e.target.value) || 10000)}
                    className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#141414]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-md border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 font-medium text-[#A1A1AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KEY GENERATED SUCCESS MODAL (One-Time Secret Reveal) */}
      {keyCreatedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#050505] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">API Key Successfully Created</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] mb-4">
              Please copy and store this API key now. For your security, this key is hashed in the database and <strong className="text-white">will never be shown again</strong>.
            </p>

            {/* Secret key box */}
            <div className="rounded-xl border border-[#222222] bg-black p-3.5 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-cyan-300 break-all select-all">
                  {keyCreatedResult.secret_key}
                </span>
                <button
                  onClick={() => handleCopySecret(keyCreatedResult.secret_key)}
                  className="flex items-center gap-1.5 rounded-md bg-[#121212] border border-[#282828] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a1a1a] shrink-0"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setKeyCreatedResult(null)}
                className="rounded-lg bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition"
              >
                I Have Saved My Secret Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMOLED Custom Revoke Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        onConfirm={async () => {
          if (keyToRevoke) {
            await revokeMutation.mutateAsync(keyToRevoke.id);
            setKeyToRevoke(null);
          }
        }}
        title="Revoke API Key"
        itemName={keyToRevoke?.name}
        description={
          keyToRevoke
            ? `Are you sure you want to permanently revoke API key "${keyToRevoke.name}" (${keyToRevoke.key_prefix}••••••••)? Any client or integration using this key will immediately lose access.`
            : undefined
        }
        confirmText="Revoke Key"
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
}
