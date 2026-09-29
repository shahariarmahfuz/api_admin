'use client';

import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Code2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { getMethodBadgeClass } from '@/lib/utils';

interface ApiTesterProps {
  initialMethod: string;
  initialEndpoint: string;
  defaultBody?: any;
  requiresAuth?: boolean;
}

export function ApiTester({
  initialMethod,
  initialEndpoint,
  defaultBody,
  requiresAuth = true,
}: ApiTesterProps) {
  const [method, setMethod] = useState(initialMethod);
  const [endpoint, setEndpoint] = useState(initialEndpoint);
  const [apiKey, setApiKey] = useState('orv_live_24dd2208_hDVNJTc6Tqvtihu17p4jitAf2JJur7FP_AN3WcPi60U');
  const [bodyText, setBodyText] = useState(
    defaultBody ? JSON.stringify(defaultBody, null, 2) : ''
  );
  const [activeTab, setActiveTab] = useState<'console' | 'curl' | 'js' | 'python'>('console');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    durationMs: number;
    data: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    setIsLoading(true);
    let parsedBody = undefined;
    if (bodyText && method !== 'GET') {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (e: any) {
        setResult({
          status: 400,
          durationMs: 0,
          data: { success: false, error: { message: 'Invalid JSON body syntax' } },
        });
        setIsLoading(false);
        return;
      }
    }

    const res = await api.testApiCall(method, endpoint, parsedBody, requiresAuth ? apiKey : undefined);
    setResult(res);
    setIsLoading(false);
  };

  const generateCurl = () => {
    let cmd = `curl -X ${method} "${endpoint.startsWith('http') ? endpoint : `http://localhost:8000${endpoint}`}"`;
    if (requiresAuth && apiKey) {
      cmd += ` \\\n  -H "Authorization: Bearer ${apiKey}"`;
    }
    if (bodyText && method !== 'GET') {
      cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText.replace(/\n\s*/g, ' ')}'`;
    }
    return cmd;
  };

  const generateJs = () => {
    const headersObj: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (requiresAuth && apiKey) headersObj['Authorization'] = `Bearer ${apiKey}`;

    return `fetch("http://localhost:8000${endpoint}", {
  method: "${method}",
  headers: ${JSON.stringify(headersObj, null, 4)},${bodyText && method !== 'GET' ? `\n  body: JSON.stringify(${bodyText})` : ''}
})
  .then(res => res.json())
  .then(data => console.log(data));`;
  };

  const generatePython = () => {
    return `import httpx

headers = {
    "Authorization": "Bearer ${apiKey}",
}
${bodyText && method !== 'GET' ? `payload = ${bodyText}\n` : ''}
with httpx.Client(base_url="http://localhost:8000") as client:
    response = client.${method.toLowerCase()}(
        "${endpoint}",
        headers=headers,${bodyText && method !== 'GET' ? '\n        json=payload,' : ''}
    )
    print(response.json())`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[#1A1A1A] bg-[#050505] overflow-hidden">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#141414] bg-[#080808] px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">
            API Console & Code Generator
          </span>
        </div>

        {/* Code tabs */}
        <div className="flex items-center rounded-lg bg-[#000000] border border-[#1A1A1A] p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'console'
                ? 'bg-[#181818] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Live Console
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'curl'
                ? 'bg-[#181818] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            cURL
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'js'
                ? 'bg-[#181818] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            JavaScript
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeTab === 'python'
                ? 'bg-[#181818] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Python
          </button>
        </div>
      </div>

      {activeTab === 'console' ? (
        <div className="p-4 space-y-4">
          {/* Request Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span
              className={`flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold ${getMethodBadgeClass(
                method
              )}`}
            >
              {method}
            </span>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 rounded-md border border-[#1A1A1A] bg-black px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isLoading ? 'Running...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Auth Header input if required */}
          {requiresAuth && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
              <span className="w-24 text-[#71717A] shrink-0">API Key:</span>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Bearer orv_live_..."
                className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-1.5 font-mono text-[#A1A1AA] text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* Body Editor if POST / PATCH */}
          {method !== 'GET' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#71717A]">Request Body (JSON):</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#1A1A1A] bg-black p-3 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* Response Viewer */}
          {result && (
            <div className="space-y-2 border-t border-[#141414] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#A1A1AA]">Response:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                      result.status >= 200 && result.status < 300
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {result.status >= 200 && result.status < 300 ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {result.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#71717A]">
                    <Clock className="h-3 w-3" />
                    {result.durationMs}ms
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                  className="flex items-center gap-1 text-xs text-[#71717A] hover:text-white transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Response'}</span>
                </button>
              </div>

              <pre className="max-h-72 overflow-auto rounded-lg border border-[#141414] bg-[#000000] p-3 text-xs font-mono text-emerald-300">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Code Generator View */
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">
              Copy and execute this snippet in your project:
            </span>
            <button
              onClick={() => {
                const code =
                  activeTab === 'curl'
                    ? generateCurl()
                    : activeTab === 'js'
                    ? generateJs()
                    : generatePython();
                copyToClipboard(code);
              }}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied snippet' : 'Copy code'}</span>
            </button>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-[#141414] bg-[#000000] p-3 text-xs font-mono text-[#F5F5F5]">
            {activeTab === 'curl' && generateCurl()}
            {activeTab === 'js' && generateJs()}
            {activeTab === 'python' && generatePython()}
          </pre>
        </div>
      )}
    </div>
  );
}
