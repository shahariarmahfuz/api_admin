'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { api } from '@/lib/api-client';
import { ApiService } from '@/lib/types';
import { getMethodBadgeClass, getStatusBadgeClass } from '@/lib/utils';
import { Search, Layers, ShieldCheck, ArrowRight, Filter } from 'lucide-react';

export default function ApisPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const res = await api.getServices();
      return (res.data || []) as ApiService[];
    },
  });

  const categories = ['all', 'utility', 'image', 'media', 'social'];

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || s.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <Layers className="h-4 w-4" />
            <span>Service Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Available API Services
          </h1>
          <p className="mt-2 text-sm text-[#A1A1AA] max-w-2xl">
            Explore our collection of modular, production-ready APIs. Each service provides dedicated rate limits, versioned routing, and documentation.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8 border-b border-[#141414] pb-6">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition capitalize ${
                  selectedCategory === cat
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#080808] text-[#A1A1AA] hover:text-white border border-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search APIs or endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#1A1A1A] bg-[#050505] pl-9 pr-4 py-2 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* API Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 rounded-xl border border-[#141414] bg-[#050505] animate-pulse p-6" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#141414] bg-[#050505] p-12 text-center text-[#71717A]">
            No APIs found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((service) => (
              <Link
                key={service.id}
                href={`/apis/${service.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-[#141414] bg-[#050505] p-5 transition hover:border-[#282828] hover:bg-[#080808]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${getMethodBadgeClass(service.method)}`}>
                        {service.method}
                      </span>
                      <span className="font-mono text-xs text-white font-medium">
                        {service.endpoint}
                      </span>
                    </div>

                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusBadgeClass(service.status)}`}>
                      {service.status}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition">
                    {service.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#71717A] line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#101010] pt-3 text-[11px] text-[#52525B]">
                  <div className="flex items-center gap-3">
                    <span className="capitalize">{service.category}</span>
                    <span>•</span>
                    <span>{service.rate_limit_per_minute} req/min</span>
                    <span>•</span>
                    <span>{service.requires_auth ? 'Auth Required' : 'Public'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-0.5 transition">
                    <span>Docs &amp; Test</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
