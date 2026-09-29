'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';

export default function AddApiPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'utility',
    endpoint: '/api/v1/',
    method: 'GET',
    version: 'v1',
    status: 'ACTIVE',
    requires_auth: true,
    rate_limit_per_minute: 60,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.createService(data);
      if (!res.success) {
        throw new Error(res.error?.message || res.message || 'Failed to create service');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      router.push('/admin/apis');
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/apis"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#71717A] hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to APIs</span>
      </Link>

      <div className="border-b border-[#141414] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Register New API Service</h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Add an endpoint to the Orvia gateway catalogue with rate limits and documentation.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#141414] bg-[#050505] p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Service Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Geolocation Lookup"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                setFormData({ ...formData, name, slug: formData.slug || slug });
              }}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Unique Slug *</label>
            <input
              type="text"
              required
              placeholder="e.g. utility-geolookup"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#A1A1AA] mb-1 font-medium">Description</label>
          <textarea
            rows={3}
            placeholder="Comprehensive description of what this API accomplishes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-md border border-[#1A1A1A] bg-black p-3 text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="utility">Utility</option>
              <option value="image">Image</option>
              <option value="media">Media</option>
              <option value="social">Social</option>
              <option value="downloader">Downloader</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">HTTP Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="BETA">BETA</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Endpoint Path *</label>
            <input
              type="text"
              required
              placeholder="/api/v1/utility/..."
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 font-mono text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[#A1A1AA] mb-1 font-medium">Rate Limit (req/min)</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={formData.rate_limit_per_minute}
              onChange={(e) =>
                setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) || 60 })
              }
              className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="requires_auth_check"
            checked={formData.requires_auth}
            onChange={(e) => setFormData({ ...formData, requires_auth: e.target.checked })}
            className="rounded border-[#1A1A1A] bg-black text-cyan-500 focus:ring-0"
          />
          <label htmlFor="requires_auth_check" className="text-white cursor-pointer font-medium">
            Requires API Key Authentication (Bearer token)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#141414]">
          <Link
            href="/admin/apis"
            className="rounded-lg border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 font-medium text-[#A1A1AA] hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{mutation.isPending ? 'Registering...' : 'Register API'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
