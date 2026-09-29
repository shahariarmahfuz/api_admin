'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api, setAuthToken, setCurrentUserStored } from '@/lib/api-client';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@orvia.dev');
  const [password, setPassword] = useState('OrviaAdmin2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await api.login({ email, password });
    if (res.success && res.data?.access_token) {
      setAuthToken(res.data.access_token);
      setCurrentUserStored(res.data.user);
      router.push('/admin');
    } else {
      setErrorMessage(res.error?.message || res.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@orvia.dev');
    setPassword('OrviaAdmin2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-[#1A1A1A] bg-[#050505] p-8 shadow-2xl relative z-10">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Orvia"
              width={160}
              height={54}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Sign In to Platform</h2>
          <p className="text-xs text-[#71717A] mt-1">
            Access admin dashboard, manage API services, and monitor traffic
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@orvia.dev"
                className="w-full rounded-lg border border-[#1A1A1A] bg-black pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#A1A1AA]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-[#1A1A1A] bg-black pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525B] focus:border-cyan-500 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50 shadow-lg"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Console'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Quick Demo Pre-fill */}
        <div className="mt-6 border-t border-[#141414] pt-4">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#222222] bg-[#0A0A0A] py-2 text-xs font-medium text-[#A1A1AA] hover:text-white hover:border-[#333333] transition"
          >
            <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
            <span>Use Default Admin Credentials</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition">
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
