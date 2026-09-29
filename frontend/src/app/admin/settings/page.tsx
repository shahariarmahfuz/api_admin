'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings, Shield, Globe, Lock, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: config = {}, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.getSystemSettings();
      return res.data || {};
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#141414] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          <span>Platform Settings &amp; Configuration</span>
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">
          Global environment variables, security rules, and connection pool configurations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Core Platform Identity */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Platform Identity</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">Project Name</span>
              <span className="font-semibold text-white">{config.project_name || 'Orvia API Platform'}</span>
            </div>
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">Environment</span>
              <span className="font-mono text-emerald-400 uppercase">{config.environment || 'PRODUCTION'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717A]">Release Version</span>
              <span className="font-mono text-cyan-400">{config.version || '1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Security & Authentication Settings */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-400" />
            <span>Security &amp; JWT Policies</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">JWT Token Expiry</span>
              <span className="font-mono text-white">{config.token_expiration_minutes || 1440} minutes (24h)</span>
            </div>
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">API Key Hash Algorithm</span>
              <span className="font-mono text-white">SHA-256 (Constant-Time Verification)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717A]">Password Cryptography</span>
              <span className="font-mono text-emerald-400">bcrypt Blowfish Key Derivation</span>
            </div>
          </div>
        </div>

        {/* Database & Pool Tuning */}
        <div className="rounded-xl border border-[#141414] bg-[#050505] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" />
            <span>Database Connection Pool</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">Maximum Pool Size</span>
              <span className="font-mono text-white">{config.database_pool_size || 15} connections</span>
            </div>
            <div className="flex justify-between border-b border-[#101010] pb-2">
              <span className="text-[#71717A]">Connection Pre-Ping</span>
              <span className="text-emerald-400 font-semibold">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71717A]">Redis Configured</span>
              <span className="font-mono text-cyan-400">
                {config.redis_configured ? 'Yes (Connected)' : 'Optional Fallback Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
