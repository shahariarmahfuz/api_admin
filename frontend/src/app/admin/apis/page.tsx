'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ApiService, ProviderIntegration } from '@/lib/types';
import { getMethodBadgeClass, getStatusBadgeClass, formatDate } from '@/lib/utils';
import {
  Layers,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  Server,
  Zap,
  Terminal,
  ShieldCheck,
  Image as ImageIcon,
  ChevronRight,
  Database,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function AdminApisPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ApiService | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ProviderIntegration | null>(null);

  // Fetch Services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await api.getServices();
      return (res.data || []) as ApiService[];
    },
  });

  // Fetch Connected Providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const res = await api.getProviders();
      return (res.data || []) as ProviderIntegration[];
    },
  });

  // Update Status / Service Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.updateService(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      setEditingService(null);
    },
  });

  // Delete Service Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
    },
  });

  // Delete Provider Mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteProvider(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
    },
  });

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || s.category.toLowerCase() === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', 'image', 'utility', 'media', 'social'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Management</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Manage real integrated cloud providers, gateway endpoints, rate limits, and access controls.
          </p>
        </div>

        <Link
          href="/admin/apis/add"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register New API / Provider</span>
        </Link>
      </div>

      {/* CONNECTED REAL PROVIDERS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Connected Real Providers
            </h2>
            <span className="rounded-full bg-[#181818] px-2 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
              {providers.length}
            </span>
          </div>
        </div>

        {isLoadingProviders ? (
          <div className="h-28 animate-pulse rounded-xl border border-[#141414] bg-[#050505] p-6 text-xs text-[#71717A]">
            Loading provider connections...
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-xl border border-[#1A1A1A] bg-[#070707] p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    No Real Providers Configured Yet
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Connect Cloudinary as your first real provider for image transformations, uploads, and media management.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/apis/add"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <span>Connect Cloudinary Now</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const isCloudinary = p.provider_name === 'cloudinary';

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#1F1F1F] bg-[#080808] p-5 hover:border-[#2D2D2D] transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        {isCloudinary ? <ImageIcon className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{p.display_name}</h3>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#71717A] font-mono">
                          Provider: {p.provider_name}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setProviderToDelete(p)}
                      title="Delete Provider Integration"
                      className="rounded-lg p-1.5 text-[#71717A] hover:bg-rose-500/10 hover:text-rose-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Masked Credentials Display */}
                  <div className="rounded-lg border border-[#171717] bg-[#040404] p-3 text-xs space-y-1 font-mono">
                    <div className="text-[10px] text-[#555555] uppercase tracking-wider font-sans mb-1 font-semibold">
                      Encrypted Credentials (AES-256)
                    </div>
                    {Object.entries(p.masked_credentials).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11px]">
                        <span className="text-[#888888]">{k}:</span>
                        <span className="text-white truncate max-w-[200px]">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#141414] text-xs">
                    <span className="text-[11px] text-[#71717A]">
                      {p.last_tested_at ? `Verified: ${formatDate(p.last_tested_at)}` : 'Active'}
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/api-test?provider=${p.provider_name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1C1C1C] transition"
                      >
                        <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Test API</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* API SERVICES CATALOG SECTION */}
      <div className="space-y-4 pt-4 border-t border-[#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Registered API Endpoints</h2>
            <p className="text-xs text-[#71717A]">
              Endpoints accessible via gateway with valid client API keys.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider capitalize transition ${
                  categoryFilter === cat
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#080808] text-[#A1A1AA] hover:text-white border border-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#52525B]" />
            <input
              type="text"
              placeholder="Search endpoint or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* API Services Table */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
          {isLoadingServices ? (
            <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Loading API catalog...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71717A] space-y-3">
              <Layers className="h-8 w-8 mx-auto text-[#333333]" />
              <p className="text-sm font-medium text-white">No API services found.</p>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                No mock services are used. Register a real integration like Cloudinary to populate gateway endpoints.
              </p>
              <Link
                href="/admin/apis/add"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition mt-2"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register Provider API</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                    <th className="py-3 px-4 font-medium">Service Name</th>
                    <th className="py-3 px-4 font-medium">Method &amp; Endpoint</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Rate Limit</th>
                    <th className="py-3 px-4 font-medium">Auth</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]">
                  {filtered.map((service) => (
                    <tr key={service.id} className="hover:bg-[#0A0A0A] transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{service.name}</div>
                        <div className="text-[11px] text-[#71717A] font-mono">{service.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${getMethodBadgeClass(
                              service.method
                            )}`}
                          >
                            {service.method}
                          </span>
                          <span className="font-mono text-zinc-300">{service.endpoint}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize text-[#A1A1AA]">{service.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                            service.status
                          )}`}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#A1A1AA]">
                        {service.rate_limit_per_minute} / min
                      </td>
                      <td className="py-3 px-4">
                        {service.requires_auth ? (
                          <span className="text-emerald-400 font-medium">Required</span>
                        ) : (
                          <span className="text-[#71717A]">Public</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/api-test?slug=${service.slug}`}
                            title="Test this API"
                            className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-cyan-400"
                          >
                            <Terminal className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => setEditingService(service)}
                            title="Edit Service"
                            className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setServiceToDelete(service)}
                            title="Delete Service"
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
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">Edit API Service</h2>
              <button
                onClick={() => setEditingService(null)}
                className="text-[#71717A] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingService.id,
                  data: {
                    name: editingService.name,
                    status: editingService.status,
                    rate_limit_per_minute: editingService.rate_limit_per_minute,
                    requires_auth: editingService.requires_auth,
                  },
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#A1A1AA] mb-1">Service Name</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] p-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1">Status</label>
                <select
                  value={editingService.status}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] p-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="BETA">BETA</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1">Rate Limit (per min)</label>
                <input
                  type="number"
                  value={editingService.rate_limit_per_minute}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      rate_limit_per_minute: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] p-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requires_auth"
                  checked={editingService.requires_auth}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      requires_auth: e.target.checked,
                    })
                  }
                  className="rounded border-[#1A1A1A] bg-[#050505] text-cyan-500"
                />
                <label htmlFor="requires_auth" className="text-white cursor-pointer">
                  Requires API Key Authentication
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#141414]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="rounded-md border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 font-medium text-[#A1A1AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AMOLED Custom Delete Service Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={async () => {
          if (serviceToDelete) {
            await deleteMutation.mutateAsync(serviceToDelete.id);
            setServiceToDelete(null);
          }
        }}
        title="Delete API Endpoint"
        itemName={serviceToDelete?.name}
        description={
          serviceToDelete
            ? `Are you sure you want to remove "${serviceToDelete.name}" (${serviceToDelete.slug}) from the API catalog?`
            : undefined
        }
        confirmText="Delete API"
        isLoading={deleteMutation.isPending}
      />

      {/* AMOLED Custom Delete Provider Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        onConfirm={async () => {
          if (providerToDelete) {
            await deleteProviderMutation.mutateAsync(providerToDelete.id);
            setProviderToDelete(null);
          }
        }}
        title="Delete Provider Integration"
        itemName={providerToDelete?.display_name}
        description={
          providerToDelete
            ? `Are you sure you want to remove "${providerToDelete.display_name}" (${providerToDelete.provider_name})? Associated gateway endpoints will also be unlinked.`
            : undefined
        }
        confirmText="Delete Provider"
        isLoading={deleteProviderMutation.isPending}
      />
    </div>
  );
}
