'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ApiService } from '@/lib/types';
import { getMethodBadgeClass, getStatusBadgeClass } from '@/lib/utils';
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
} from 'lucide-react';

export default function AdminApisPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingService, setEditingService] = useState<ApiService | null>(null);

  // Fetch Services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await api.getServices();
      return (res.data || []) as ApiService[];
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

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteService(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
    },
  });

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || s.category.toLowerCase() === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['all', 'utility', 'image', 'media', 'social'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Management</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Configure catalog services, modify operational statuses, and tune rate limits.
          </p>
        </div>

        <Link
          href="/admin/apis/add"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register New API</span>
        </Link>
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
            placeholder="Search API or endpoint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* API Services Table */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Loading API catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">No services found.</div>
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
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {filtered.map((service) => (
                  <tr key={service.id} className="hover:bg-[#080808] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{service.name}</div>
                      <div className="text-[11px] text-[#52525B]">{service.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getMethodBadgeClass(service.method)}`}>
                          {service.method}
                        </span>
                        <span className="font-mono text-white text-xs">{service.endpoint}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">{service.category}</td>
                    <td className="py-3 px-4">
                      <select
                        value={service.status}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: service.id,
                            data: { status: e.target.value },
                          })
                        }
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold bg-transparent focus:outline-none cursor-pointer ${getStatusBadgeClass(service.status)}`}
                      >
                        <option value="ACTIVE" className="bg-black text-emerald-400">ACTIVE</option>
                        <option value="BETA" className="bg-black text-cyan-400">BETA</option>
                        <option value="MAINTENANCE" className="bg-black text-amber-400">MAINTENANCE</option>
                        <option value="INACTIVE" className="bg-black text-zinc-400">INACTIVE</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-white">
                      {service.rate_limit_per_minute}/min
                    </td>
                    <td className="py-3 px-4">
                      {service.requires_auth ? (
                        <span className="text-cyan-400 font-medium">Key Req</span>
                      ) : (
                        <span className="text-[#52525B]">Public</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/apis/${service.slug}`}
                          target="_blank"
                          title="View public documentation"
                          className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditingService(service)}
                          title="Edit Service"
                          className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-cyan-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove '${service.name}' from API catalog?`)) {
                              deleteMutation.mutate(service.id);
                            }
                          }}
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

      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1A1A1A] bg-[#050505] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
              <h3 className="text-base font-bold text-white">Edit API Service</h3>
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
                    description: editingService.description,
                    status: editingService.status,
                    rate_limit_per_minute: Number(editingService.rate_limit_per_minute),
                    requires_auth: editingService.requires_auth,
                  },
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Service Name</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Description</label>
                <textarea
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black p-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A1A1AA] mb-1 font-medium">Status</label>
                  <select
                    value={editingService.status}
                    onChange={(e: any) =>
                      setEditingService({ ...editingService, status: e.target.value })
                    }
                    className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BETA">BETA</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A1A1AA] mb-1 font-medium">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={editingService.rate_limit_per_minute}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        rate_limit_per_minute: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
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
                  className="rounded border-[#1A1A1A] bg-black text-cyan-500 focus:ring-0"
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
                  className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
