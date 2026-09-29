'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ProviderBlueprint } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Server,
  Image as ImageIcon,
  Zap,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function RegisterApiPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Wizard Step: 1 = Choose Provider, 2 = Credentials & Connection Test, 3 = Service Details
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedProvider, setSelectedProvider] = useState<string>('cloudinary');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency_ms?: number;
  } | null>(null);

  // Service Metadata
  const [serviceName, setServiceName] = useState('Cloudinary Media Service');
  const [serviceSlug, setServiceSlug] = useState('cloudinary-media');
  const [description, setDescription] = useState(
    'Cloud-based image and video optimization, transformation, and storage gateway.'
  );
  const [category, setCategory] = useState('image');
  const [status, setStatus] = useState('ACTIVE');
  const [rateLimit, setRateLimit] = useState(60);
  const [autoRegisterEndpoints, setAutoRegisterEndpoints] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Available Blueprints
  const { data: blueprints = [], isLoading: isLoadingBlueprints } = useQuery({
    queryKey: ['provider-blueprints'],
    queryFn: async () => {
      const res = await api.getProviderBlueprints();
      return (res.data || []) as ProviderBlueprint[];
    },
  });

  const activeBlueprint = blueprints.find((b) => b.provider_name === selectedProvider);

  // Initialize defaults when blueprint changes
  useEffect(() => {
    if (activeBlueprint) {
      const initialCreds: Record<string, string> = {};
      activeBlueprint.fields.forEach((f) => {
        initialCreds[f.key] = credentials[f.key] || f.default || '';
      });
      setCredentials(initialCreds);

      if (activeBlueprint.provider_name === 'cloudinary') {
        setServiceName('Cloudinary Media Service');
        setServiceSlug('cloudinary-media');
        setDescription('Cloud-based image and video optimization, transformation, and storage gateway.');
        setCategory('image');
      } else {
        setServiceName(activeBlueprint.display_name);
        setServiceSlug(activeBlueprint.provider_name);
        setDescription(activeBlueprint.description);
        setCategory(activeBlueprint.category);
      }
      setTestResult(null);
    }
  }, [selectedProvider, activeBlueprint]);

  // Handle Credential Input Change
  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setTestResult(null); // Reset connection test on change
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Run Real Connection Test
  const handleTestConnection = async () => {
    if (!activeBlueprint) return;
    setIsTesting(true);
    setTestResult(null);
    setFormError(null);

    try {
      const res = await api.testProviderConnection({
        provider_name: activeBlueprint.provider_name,
        credentials,
      });

      if (res.success && res.data?.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'Credentials verified successfully.',
          latency_ms: res.data.latency_ms,
        });
      } else {
        setTestResult({
          success: false,
          message: res.data?.message || res.error?.message || 'Authentication failed. Check your credentials.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Could not verify credentials. Network error.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Create Provider & Register Services Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        provider_name: selectedProvider,
        display_name: serviceName,
        credentials,
        register_services: autoRegisterEndpoints,
      };
      const res = await api.createProvider(payload);
      if (!res.success) {
        throw new Error(res.error?.message || res.message || 'Failed to register provider integration');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      router.push('/admin/apis');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to register provider');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (activeBlueprint) {
      for (const field of activeBlueprint.fields) {
        if (field.required && !credentials[field.key]?.trim()) {
          setFormError(`Please enter a valid "${field.label}"`);
          return;
        }
      }
    }

    registerMutation.mutate();
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/apis"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#71717A] hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All APIs</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
          <span className="font-mono text-emerald-400">Step {currentStep} of 3</span>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Register New API / Provider
        </h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Connect a real API provider with encrypted credentials, test connection live, and auto-provision gateway endpoints.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-3 gap-2 border-b border-[#1A1A1A] pb-6">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition ${
            currentStep === 1
              ? 'bg-[#121212] border border-[#2E2E2E] text-white font-medium'
              : 'text-[#71717A] hover:text-white'
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              currentStep === 1 ? 'bg-emerald-500 text-black' : 'bg-[#1F1F1F] text-[#71717A]'
            }`}
          >
            1
          </span>
          <span className="truncate">Choose Provider</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition ${
            currentStep === 2
              ? 'bg-[#121212] border border-[#2E2E2E] text-white font-medium'
              : 'text-[#71717A] hover:text-white'
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              currentStep === 2 ? 'bg-emerald-500 text-black' : 'bg-[#1F1F1F] text-[#71717A]'
            }`}
          >
            2
          </span>
          <span className="truncate">Credentials &amp; Test</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition ${
            currentStep === 3
              ? 'bg-[#121212] border border-[#2E2E2E] text-white font-medium'
              : 'text-[#71717A] hover:text-white'
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              currentStep === 3 ? 'bg-emerald-500 text-black' : 'bg-[#1F1F1F] text-[#71717A]'
            }`}
          >
            3
          </span>
          <span className="truncate">Service &amp; Publish</span>
        </button>
      </div>

      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE PROVIDER BLUEPRINT */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white">Select API Provider Architecture</h2>
            <p className="text-xs text-[#71717A]">
              Choose from officially supported cloud providers or configure a generic REST microservice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingBlueprints ? (
              <div className="col-span-2 h-40 animate-pulse rounded-xl border border-[#1A1A1A] bg-[#0A0A0A] p-6 text-xs text-[#71717A]">
                Loading available provider blueprints...
              </div>
            ) : (
              blueprints.map((bp) => {
                const isSelected = selectedProvider === bp.provider_name;
                const isCloudinary = bp.provider_name === 'cloudinary';

                return (
                  <div
                    key={bp.provider_name}
                    onClick={() => setSelectedProvider(bp.provider_name)}
                    className={`relative cursor-pointer rounded-xl border p-5 transition ${
                      isSelected
                        ? 'border-emerald-500 bg-[#0C120F] ring-1 ring-emerald-500/50'
                        : 'border-[#1F1F1F] bg-[#080808] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                            isSelected
                              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                              : 'border-[#262626] bg-[#141414] text-[#A1A1AA]'
                          }`}
                        >
                          {isCloudinary ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : (
                            <Server className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{bp.display_name}</h3>
                            {isCloudinary && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                Recommended
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#71717A] capitalize font-mono">
                            Category: {bp.category}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-black'
                            : 'border-[#333333] bg-[#141414]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-[#A1A1AA] leading-relaxed">
                      {bp.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-[#171717]">
                      {bp.supported_operations.map((op) => (
                        <span
                          key={op}
                          className="rounded bg-[#121212] px-2 py-0.5 text-[10px] font-mono text-[#888888] border border-[#202020]"
                        >
                          {op}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30"
            >
              <span>Continue to Credentials</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CREDENTIALS & CONNECTION TEST */}
      {currentStep === 2 && activeBlueprint && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">
                {activeBlueprint.display_name} Credentials
              </h2>
              <p className="text-xs text-[#71717A]">
                Credentials are encrypted using AES/Fernet encryption at rest before being saved to PostgreSQL.
              </p>
            </div>

            {activeBlueprint.docs_url && (
              <a
                href={activeBlueprint.docs_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
              >
                <span>Provider Docs</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* Dynamic Fields Grid */}
          <div className="space-y-4 rounded-xl border border-[#1A1A1A] bg-[#080808] p-6">
            {activeBlueprint.fields.map((field) => {
              const isPassword = field.type === 'password';
              const isVisible = showSecrets[field.key] || false;
              const inputType = isPassword ? (isVisible ? 'text' : 'password') : 'text';

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white flex items-center gap-1.5">
                      {field.label}
                      {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    {field.description && (
                      <span className="text-[11px] text-[#71717A]">{field.description}</span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={inputType}
                      value={credentials[field.key] || ''}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white placeholder-[#444444] focus:border-emerald-500 focus:outline-none transition font-mono"
                    />

                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                        title={isVisible ? 'Hide secret' : 'Reveal secret'}
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Test Connection Banner */}
            <div className="mt-6 pt-4 border-t border-[#171717] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-[#A1A1AA]">
                  Verify credentials live before provisioning APIs:
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-xs font-medium text-white hover:bg-[#1E1E1E] transition disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>Verifying with Provider...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Test Feedback Banner */}
            {testResult && (
              <div
                className={`mt-4 flex items-center justify-between rounded-lg border p-3.5 text-xs ${
                  testResult.success
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>

                {testResult.latency_ms !== undefined && (
                  <span className="font-mono text-[11px] font-semibold text-emerald-400">
                    {testResult.latency_ms} ms
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="rounded-lg border border-[#262626] bg-[#121212] px-4 py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-white"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30"
            >
              <span>Continue to Gateway Config</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GATEWAY SERVICE & PUBLISH */}
      {currentStep === 3 && activeBlueprint && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white">Gateway API Configuration</h2>
            <p className="text-xs text-[#71717A]">
              Configure how this integration is published to API consumers and rate limited.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-[#1A1A1A] bg-[#080808] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Service Display Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">API Slug / Identifier</label>
                <input
                  type="text"
                  value={serviceSlug}
                  onChange={(e) => setServiceSlug(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="image">Image / Media</option>
                  <option value="utility">Utility</option>
                  <option value="social">Social</option>
                  <option value="storage">Cloud Storage</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="BETA">BETA</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white">Rate Limit (req / min)</label>
                <input
                  type="number"
                  min={1}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Auto Register Gateway Checkbox */}
            <div className="mt-4 pt-4 border-t border-[#171717]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegisterEndpoints}
                  onChange={(e) => setAutoRegisterEndpoints(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#333333] bg-[#141414] text-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <div>
                  <span className="text-xs font-semibold text-white">
                    Auto-register official gateway endpoints into catalog
                  </span>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Automatically provisions public routes like{' '}
                    <code className="text-emerald-400">/api/v1/cloudinary/upload</code> and{' '}
                    <code className="text-emerald-400">/api/v1/cloudinary/transform</code> in the catalog and documentation.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="rounded-lg border border-[#262626] bg-[#121212] px-4 py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-white"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30 disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Encrypting &amp; Provisioning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Save Integration &amp; Register API</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
