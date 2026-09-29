'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  itemName?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-xl border border-[#222222] bg-[#0A0A0A] p-6 text-left shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#71717A] hover:bg-[#141414] hover:text-white transition disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              isDanger
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
            <div className="mt-2 text-sm text-[#A1A1AA]">
              {description ? (
                <p>{description}</p>
              ) : itemName ? (
                <p>
                  Are you sure you want to remove{' '}
                  <span className="font-semibold text-white underline decoration-[#333333]">
                    "{itemName}"
                  </span>
                  ?
                </p>
              ) : (
                <p>Are you sure you want to proceed with this destructive action?</p>
              )}
              <p className="mt-1.5 text-xs text-rose-400/90 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex justify-center rounded-lg border border-[#262626] bg-[#121212] px-4 py-2.5 text-sm font-medium text-[#D4D4D8] hover:bg-[#1C1C1C] hover:text-white transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition shadow-lg disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
