'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ApiTester } from '@/components/ApiTester';
import { api } from '@/lib/api-client';
import { ApiService } from '@/lib/types';
import { getMethodBadgeClass, getStatusBadgeClass } from '@/lib/utils';
import { ArrowLeft, KeyRound, Shield, Clock, CheckCircle, Info, Copy } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ApiDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['api-service', slug],
    queryFn: async () => {
      const res = await api.getServiceBySlug(slug);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Service not found');
      }
      return res.data as ApiService;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[#111111] rounded" />
          <div className="h-10 w-96 bg-[#111111] rounded" />
          <div className="h-64 bg-[#080808] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">API Not Found</h1>
          <p className="mt-2 text-sm text-[#71717A]">
            The requested API endpoint '{slug}' could not be located in the platform catalogue.
          </p>
          <Link
            href="/apis"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white border border-[#222222]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to APIs</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const doc = service.documentation || {};
  const paramsList = doc.parameters || [];
  const headersList = doc.headers || [];
  const responsesObj = doc.responses || {};

  // Build default test payload if parameters exist
  const defaultBody = paramsList.length > 0
    ? paramsList.reduce((acc: any, p: any) => {
        acc[p.name] = p.default !== undefined ? p.default : (p.type === 'integer' ? 10 : 'sample');
        return acc;
      }, {})
    : undefined;

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Link */}
        <Link
          href="/apis"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#71717A] hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to API Catalog</span>
        </Link>

        {/* Hero / Endpoint Header */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className={`rounded-md border px-3 py-1 text-xs font-bold ${getMethodBadgeClass(service.method)}`}>
                {service.method}
              </span>
              <span className="font-mono text-base sm:text-lg font-bold text-white">
                {service.endpoint}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${getStatusBadgeClass(service.status)}`}>
                {service.status}
              </span>
              <span className="rounded-full border border-[#222222] bg-[#0A0A0A] px-2.5 py-0.5 text-xs text-[#A1A1AA] uppercase">
                {service.version}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{service.name}</h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-3xl">
            {service.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[#101010] pt-4 text-xs text-[#71717A]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Rate Limit: {service.rate_limit_per_minute} req/min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-purple-400" />
              <span>Auth: {service.requires_auth ? 'API Key Required' : 'Public Access'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="capitalize">Category: {service.category}</span>
            </div>
          </div>
        </div>

        {/* Two-column Layout: Specs & Interactive Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: API Specification */}
          <div className="lg:col-span-6 space-y-8">
            {/* Headers Table */}
            {headersList.length > 0 && (
              <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-cyan-400" />
                  <span>Request Headers</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#141414] text-[#71717A]">
                        <th className="pb-2 font-medium">Header</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Required</th>
                        <th className="pb-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                      {headersList.map((h: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-mono text-white font-medium">{h.name}</td>
                          <td className="py-2.5 text-[#71717A]">{h.type}</td>
                          <td className="py-2.5">
                            <span className="text-rose-400 font-semibold">Yes</span>
                          </td>
                          <td className="py-2.5">{h.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Parameters Table */}
            <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-400" />
                <span>Parameters / Payload</span>
              </h3>
              {paramsList.length === 0 ? (
                <p className="text-xs text-[#71717A]">No body or query parameters required for this endpoint.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#141414] text-[#71717A]">
                        <th className="pb-2 font-medium">Parameter</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Required</th>
                        <th className="pb-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                      {paramsList.map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-mono text-white font-medium">{p.name}</td>
                          <td className="py-2.5 text-[#71717A]">{p.type}</td>
                          <td className="py-2.5">
                            {p.required ? (
                              <span className="text-rose-400 font-semibold">Yes</span>
                            ) : (
                              <span className="text-[#52525B]">No</span>
                            )}
                          </td>
                          <td className="py-2.5">{p.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Example Response */}
            <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                Expected 200 OK Response
              </h3>
              <pre className="overflow-x-auto rounded-lg border border-[#141414] bg-black p-3 text-xs font-mono text-emerald-400">
                {JSON.stringify(
                  responsesObj['200']?.example || {
                    success: true,
                    data: {},
                    message: "Request completed successfully"
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {/* Right Column: Interactive Live Runner */}
          <div className="lg:col-span-6">
            <div className="sticky top-20">
              <div className="mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Interactive Console
                </span>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Execute live requests directly against the Orvia API gateway:
                </p>
              </div>

              <ApiTester
                initialMethod={service.method}
                initialEndpoint={service.endpoint}
                defaultBody={defaultBody}
                requiresAuth={service.requires_auth}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
