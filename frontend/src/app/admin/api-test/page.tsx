'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ProviderIntegration, TestHistoryItem } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import {
  Terminal,
  Play,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  History,
  Server,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

function ApiTesterContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialProvider = searchParams.get('provider') || 'cloudinary';

  // Fetch Connected Providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const res = await api.getProviders();
      return (res.data || []) as ProviderIntegration[];
    },
  });

  // Selected Provider & Operation
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<string>('upload_image');

  // Parameters for Cloudinary
  const [fileMode, setFileMode] = useState<'upload' | 'url'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>(
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
  );
  const [folder, setFolder] = useState<string>('api_platform_test');
  const [publicId, setPublicId] = useState<string>('');
  const [tags, setTags] = useState<string>('test, demo, platform');

  // Transformation params
  const [transformWidth, setTransformWidth] = useState<number>(400);
  const [transformHeight, setTransformHeight] = useState<number>(400);
  const [transformCrop, setTransformCrop] = useState<string>('fill');
  const [transformFormat, setTransformFormat] = useState<string>('webp');
  const [transformQuality, setTransformQuality] = useState<string>('auto');

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    status_code: number;
    response_time_ms: number;
    success: boolean;
    data: any;
    error_message?: string;
  } | null>(null);

  // Sync selected provider
  useEffect(() => {
    if (providers.length > 0) {
      const matched = providers.find((p) => p.provider_name === initialProvider);
      if (matched) {
        setSelectedProviderId(matched.id);
      } else if (!selectedProviderId) {
        setSelectedProviderId(providers[0].id);
      }
    }
  }, [providers, initialProvider, selectedProviderId]);

  const activeProvider = providers.find((p) => p.id === selectedProviderId);

  // Fetch Test History
  const { data: testHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['admin-test-history'],
    queryFn: async () => {
      const res = await api.getAdminTestHistory(15);
      return (res.data || []) as TestHistoryItem[];
    },
  });

  // Execute Test Handler
  const handleExecute = async () => {
    if (!activeProvider) return;
    setIsExecuting(true);
    setCopiedResponse(false);

    try {
      if (selectedOperation === 'upload_image' && fileMode === 'upload' && selectedFile) {
        // Multipart Upload Test
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('provider_id', activeProvider.id);
        formData.append('provider_name', activeProvider.provider_name);
        formData.append('operation', 'upload_image');
        formData.append('folder', folder);
        if (publicId) formData.append('public_id', publicId);
        if (tags) formData.append('tags', tags);

        const res = await api.executeAdminUploadTest(formData);
        if (res.success && res.data) {
          setLastResult(res.data);
          // If upload returned public_id, auto-fill for subsequent get/transform tests!
          if (res.data.data?.public_id) {
            setPublicId(res.data.data.public_id);
          }
        } else {
          setLastResult({
            status_code: 500,
            response_time_ms: 0,
            success: false,
            data: res.error || { message: res.message },
            error_message: res.error?.message || res.message,
          });
        }
      } else {
        // Standard JSON Operation Test
        let params: Record<string, any> = {};

        if (selectedOperation === 'upload_image') {
          params = {
            file_url: fileUrl,
            folder,
            public_id: publicId || undefined,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          };
        } else if (selectedOperation === 'get_resource' || selectedOperation === 'delete_resource') {
          params = { public_id: publicId };
        } else if (selectedOperation === 'generate_url') {
          params = {
            public_id: publicId || 'sample',
            width: transformWidth,
            height: transformHeight,
            crop: transformCrop,
            format: transformFormat,
            quality: transformQuality,
          };
        }

        const res = await api.executeAdminTest({
          provider_id: activeProvider.id,
          provider_name: activeProvider.provider_name,
          operation: selectedOperation,
          params,
        });

        if (res.success && res.data) {
          setLastResult(res.data);
          if (res.data.data?.public_id) {
            setPublicId(res.data.data.public_id);
          }
        } else {
          setLastResult({
            status_code: 500,
            response_time_ms: 0,
            success: false,
            data: res.error || { message: res.message },
            error_message: res.error?.message || res.message,
          });
        }
      }

      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['admin-test-history'] });
    } catch (err: any) {
      setLastResult({
        status_code: 0,
        response_time_ms: 0,
        success: false,
        data: { error: err.message },
        error_message: err.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const previewImageUrl =
    lastResult?.data?.secure_url ||
    lastResult?.data?.url ||
    (lastResult?.data?.transformed_url ? lastResult.data.transformed_url : null);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">API Test Console</h1>
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Execute real operations directly against connected providers. Zero secrets are exposed to the browser.
          </p>
        </div>

        {activeProvider && (
          <div className="flex items-center gap-2 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-3.5 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#A1A1AA]">Active Target:</span>
            <span className="font-semibold text-white">{activeProvider.display_name}</span>
          </div>
        )}
      </div>

      {providers.length === 0 && !isLoadingProviders ? (
        <div className="rounded-xl border border-[#1F1F1F] bg-[#080808] p-8 text-center space-y-4">
          <Server className="h-10 w-10 mx-auto text-[#444444]" />
          <h2 className="text-base font-semibold text-white">No Connected Providers Found</h2>
          <p className="text-xs text-[#71717A] max-w-md mx-auto">
            To test real operations, please register a provider integration like Cloudinary first.
          </p>
          <a
            href="/admin/apis/add"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30"
          >
            <span>Register Provider Integration</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: REQUEST CONFIGURATION (7 COLS) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 space-y-5">
              {/* Target Provider & Operation Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA]">Provider Integration</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} ({p.provider_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA]">Operation</label>
                  <select
                    value={selectedOperation}
                    onChange={(e) => setSelectedOperation(e.target.value)}
                    className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="upload_image">Upload Image Asset</option>
                    <option value="generate_url">Generate Transformed Delivery URL</option>
                    <option value="get_resource">Inspect Resource Metadata</option>
                    <option value="delete_resource">Delete Resource</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC OPERATION PARAMETERS */}
              {selectedOperation === 'upload_image' && (
                <div className="space-y-4 pt-3 border-t border-[#171717]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Upload Source</span>
                    <div className="flex items-center rounded-lg border border-[#222222] bg-[#0E0E0E] p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setFileMode('url')}
                        className={`rounded-md px-2.5 py-1 transition ${
                          fileMode === 'url' ? 'bg-[#1E1E1E] text-white font-medium' : 'text-[#71717A]'
                        }`}
                      >
                        Remote URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setFileMode('upload')}
                        className={`rounded-md px-2.5 py-1 transition ${
                          fileMode === 'upload' ? 'bg-[#1E1E1E] text-white font-medium' : 'text-[#71717A]'
                        }`}
                      >
                        Local File
                      </button>
                    </div>
                  </div>

                  {fileMode === 'url' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Image Remote URL</label>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Choose Image File</label>
                      <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2A2A] bg-[#0B0B0B] p-5 text-center hover:border-emerald-500/50 transition">
                        <Upload className="h-6 w-6 text-[#71717A] mb-2" />
                        <span className="text-xs text-white font-medium">
                          {selectedFile ? selectedFile.name : 'Click or drag image file here'}
                        </span>
                        <span className="text-[11px] text-[#555555] mt-0.5">PNG, JPG, WEBP, GIF up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Destination Folder</label>
                      <input
                        type="text"
                        value={folder}
                        onChange={(e) => setFolder(e.target.value)}
                        placeholder="e.g. api_platform_test"
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Custom Public ID (Optional)</label>
                      <input
                        type="text"
                        value={publicId}
                        onChange={(e) => setPublicId(e.target.value)}
                        placeholder="e.g. hero-banner-01"
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA]">Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. platform, avatar, public"
                      className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedOperation === 'generate_url' && (
                <div className="space-y-4 pt-3 border-t border-[#171717]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white flex items-center justify-between">
                      <span>Target Asset Public ID</span>
                      <span className="text-[11px] text-[#71717A]">
                        Use uploaded asset or 'sample'
                      </span>
                    </label>
                    <input
                      type="text"
                      value={publicId}
                      onChange={(e) => setPublicId(e.target.value)}
                      placeholder="e.g. api_platform_test/sample"
                      className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Width (px)</label>
                      <input
                        type="number"
                        value={transformWidth}
                        onChange={(e) => setTransformWidth(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Height (px)</label>
                      <input
                        type="number"
                        value={transformHeight}
                        onChange={(e) => setTransformHeight(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Crop Mode</label>
                      <select
                        value={transformCrop}
                        onChange={(e) => setTransformCrop(e.target.value)}
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="fill">fill (smart crop)</option>
                        <option value="scale">scale (preserve ratio)</option>
                        <option value="thumb">thumb (thumbnail)</option>
                        <option value="crop">crop</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Output Format</label>
                      <select
                        value={transformFormat}
                        onChange={(e) => setTransformFormat(e.target.value)}
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                      >
                        <option value="webp">webp (recommended)</option>
                        <option value="avif">avif (ultra compact)</option>
                        <option value="jpg">jpg</option>
                        <option value="png">png</option>
                        <option value="auto">auto</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1AA]">Quality</label>
                      <select
                        value={transformQuality}
                        onChange={(e) => setTransformQuality(e.target.value)}
                        className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="auto">auto (optimal)</option>
                        <option value="auto:eco">auto:eco (save data)</option>
                        <option value="auto:best">auto:best (highest)</option>
                        <option value="80">80%</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(selectedOperation === 'get_resource' || selectedOperation === 'delete_resource') && (
                <div className="space-y-3 pt-3 border-t border-[#171717]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white flex items-center justify-between">
                      <span>Asset Public ID</span>
                      <span className="text-[11px] text-[#71717A]">
                        Required for Cloudinary Admin API lookup
                      </span>
                    </label>
                    <input
                      type="text"
                      value={publicId}
                      onChange={(e) => setPublicId(e.target.value)}
                      placeholder="e.g. api_platform_test/sample"
                      className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {selectedOperation === 'delete_resource' && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                      Warning: Executing this will permanently delete the asset from Cloudinary storage.
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#666666]">
                  Target: {activeProvider?.provider_name} API
                </span>

                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isExecuting || !activeProvider}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Executing Request...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE RESPONSE & INSPECTOR (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 space-y-4 flex flex-col h-full min-h-[460px]">
              {/* Response Header Status */}
              <div className="flex items-center justify-between border-b border-[#141414] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Live Execution Response</span>
                </div>

                {lastResult && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold font-mono ${
                        lastResult.success && lastResult.status_code >= 200 && lastResult.status_code < 300
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {lastResult.status_code || (lastResult.success ? 200 : 500)} OK
                    </span>

                    <span className="flex items-center gap-1 rounded bg-[#141414] px-2 py-0.5 text-[11px] font-mono text-[#A1A1AA] border border-[#222222]">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>{lastResult.response_time_ms} ms</span>
                    </span>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify(lastResult.data, null, 2))}
                      className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-white transition"
                      title="Copy response JSON"
                    >
                      {copiedResponse ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Result Viewer */}
              {!lastResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#555555]">
                  <Terminal className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium text-[#777777]">Awaiting Request Execution</p>
                  <p className="text-[11px] mt-1 text-[#555555]">
                    Configure parameters and click "Send Request" to view live response status &amp; payload.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Image Preview Card if URL is available */}
                  {previewImageUrl && (
                    <div className="rounded-lg border border-[#222222] bg-[#040404] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
                        <span className="flex items-center gap-1.5 font-medium text-white">
                          <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Delivered Asset Preview</span>
                        </span>
                        <a
                          href={previewImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>Open full size</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="overflow-hidden rounded-md border border-[#181818] bg-black/60 flex items-center justify-center p-2 max-h-48">
                        <img
                          src={previewImageUrl}
                          alt="Cloudinary delivery preview"
                          className="max-h-44 object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* JSON Code Viewer */}
                  <div className="flex-1 overflow-auto rounded-lg border border-[#1B1B1B] bg-[#040404] p-3.5 text-[11px] font-mono text-[#D4D4D8] max-h-80 select-all">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(lastResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT / TEST HISTORY SECTION */}
      <div className="rounded-xl border border-[#141414] bg-[#050505] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#71717A]" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Recent Provider Test Executions
            </h2>
            <span className="text-[11px] text-[#555555]">
              (Audit log — zero credentials stored)
            </span>
          </div>

          <button
            onClick={() => refetchHistory()}
            className="text-[11px] text-[#71717A] hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>

        {testHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#555555]">
            No tests executed yet. Run an operation above to record latency metrics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                  <th className="py-2.5 px-3 font-medium">Provider</th>
                  <th className="py-2.5 px-3 font-medium">Operation</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Latency</th>
                  <th className="py-2.5 px-3 font-medium">Result</th>
                  <th className="py-2.5 px-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121212]">
                {testHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#080808] transition">
                    <td className="py-2.5 px-3 font-semibold text-white uppercase font-mono text-[11px]">
                      {item.provider_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">
                      {item.operation}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          item.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {item.status_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#A1A1AA]">
                      {item.response_time_ms} ms
                    </td>
                    <td className="py-2.5 px-3">
                      {item.success ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Success</span>
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-[11px] text-rose-400 font-medium truncate max-w-[200px]"
                          title={item.error_message || 'Failed'}
                        >
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span className="truncate">{item.error_message || 'Failed'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px] text-[#71717A]">
                      {formatRelativeTime(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminApiTestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#71717A]">Loading API Test Console...</div>}>
      <ApiTesterContent />
    </Suspense>
  );
}
