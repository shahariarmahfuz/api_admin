'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, setCurrentUserStored } from '@/lib/api-client';
import { User, SecurityDetails } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  User as UserIcon,
  ShieldCheck,
  Key,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ConfirmationModal';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tabParam = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security' | 'account'>(
    tabParam === 'password' || tabParam === 'security' || tabParam === 'account'
      ? tabParam
      : 'profile'
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam && ['profile', 'password', 'security', 'account'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Fetch Current User Profile
  const { data: user, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const res = await api.getMyProfile();
      if (res.data) {
        setCurrentUserStored(res.data);
      }
      return res.data;
    },
  });

  // Fetch Security Details
  const { data: security, isLoading: isLoadingSecurity } = useQuery({
    queryKey: ['my-security-overview'],
    queryFn: async () => {
      const res = await api.getMySecurityOverview();
      return res.data;
    },
  });

  // Name Update Form State
  const [fullName, setFullName] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Modals
  const [removeAvatarModalOpen, setRemoveAvatarModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await api.updateMyProfile({ full_name: newName });
      if (!res.success) throw new Error(res.error?.message || 'Failed to update profile');
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['current-user-profile'], updatedUser);
      setCurrentUserStored(updatedUser);
      setProfileSuccessMsg('Profile information updated successfully.');
      setProfileErrorMsg(null);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setProfileErrorMsg(err.message || 'Failed to update name');
      setProfileSuccessMsg(null);
    },
  });

  // Avatar Upload Handler
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingAvatar(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const res = await api.uploadMyAvatar(file);
      if (res.success && res.data) {
        queryClient.setQueryData(['current-user-profile'], res.data);
        setCurrentUserStored(res.data);
        setProfileSuccessMsg('Profile photo updated successfully.');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(res.error?.message || 'Failed to upload photo');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Photo upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Avatar Remove Mutation
  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      const res = await api.removeMyAvatar();
      if (!res.success) throw new Error(res.error?.message || 'Failed to remove avatar');
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['current-user-profile'], updatedUser);
      setCurrentUserStored(updatedUser);
      setRemoveAvatarModalOpen(false);
      setProfileSuccessMsg('Profile photo removed.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setProfileErrorMsg(err.message || 'Failed to remove avatar');
    },
  });

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 8) {
      setPasswordErrorMsg('New password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation password do not match.');
      return;
    }

    try {
      const res = await api.changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.success) {
        setPasswordSuccessMsg('Password changed successfully. Your account is secured.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      } else {
        setPasswordErrorMsg(res.error?.message || res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'An error occurred updating password.');
    }
  };

  const initial = user?.full_name?.trim()?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#141414] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Account &amp; Security Settings
        </h1>
        <p className="mt-1 text-xs text-[#71717A]">
          Manage your administrator profile, credentials, avatar photo, and account security.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#121212]'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'password'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Key className="h-4 w-4" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'security'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#121212]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Security &amp; Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'account'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#121212]'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Alerts */}
      {profileSuccessMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {profileErrorMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {/* TAB 1: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Avatar Photo Section */}
          <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Profile Photo</h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo Display */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#262626] bg-[#121212] text-2xl font-bold text-cyan-400 shadow-xl">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || 'Admin'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  </div>
                )}
              </div>

              {/* Photo Actions */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <label className="relative inline-flex items-center gap-2 rounded-lg bg-[#141414] border border-[#2A2A2A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E1E1E] transition cursor-pointer shadow-sm">
                    <Camera className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      disabled={isUploadingAvatar}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  {user?.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setRemoveAvatarModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#71717A]">
                  JPG, PNG, or WEBP up to 5MB. Powered by the platform's media integration engine.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information Form */}
          <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate(fullName);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full max-w-md rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Email Address</label>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-lg border border-[#1C1C1C] bg-[#070707] px-3.5 py-2.5 text-xs text-[#71717A] cursor-not-allowed font-mono"
                  />
                  <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 shrink-0">
                    VERIFIED
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A1A1AA]">Role &amp; Permissions</label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#181818] px-3 py-1 text-xs font-semibold text-white border border-[#262626]">
                    {user?.role?.toUpperCase() || 'ADMIN'}
                  </span>
                  <span className="text-[11px] text-[#71717A]">
                    Full platform administrator access
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">Change Account Password</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Passwords are encrypted using Argon2/bcrypt with strong work factors. Never shared or stored in plaintext.
            </p>
          </div>

          {passwordSuccessMsg && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">New Password</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full rounded-lg border border-[#222222] bg-[#0E0E0E] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/30"
              >
                <Key className="h-4 w-4" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 space-y-2">
              <div className="text-[11px] text-[#71717A] uppercase font-mono tracking-wider">
                Account Status
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SECURED</span>
              </div>
              <div className="text-[11px] text-[#555555]">
                Full administrative privileges
              </div>
            </div>

            <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 space-y-2">
              <div className="text-[11px] text-[#71717A] uppercase font-mono tracking-wider">
                Active API Keys
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {security?.active_api_keys_count ?? 0}
              </div>
              <div className="text-[11px] text-[#555555]">
                Associated with this account
              </div>
            </div>

            <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-5 space-y-2">
              <div className="text-[11px] text-[#71717A] uppercase font-mono tracking-wider">
                Last Activity
              </div>
              <div className="text-sm font-medium text-white truncate">
                {security?.last_login_at ? formatRelativeTime(security.last_login_at) : 'Active Now'}
              </div>
              <div className="text-[11px] text-[#555555]">
                {security?.last_login_at ? formatDate(security.last_login_at) : 'Current session'}
              </div>
            </div>
          </div>

          {/* Security Checklist */}
          <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Platform Security Architecture</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 rounded-lg border border-[#171717] bg-[#050505] p-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Fernet AES-256 Encrypted Credential Vault</div>
                  <div className="text-[#71717A] text-[11px] mt-0.5">
                    Third-party API keys (e.g. Cloudinary secrets) are encrypted at rest with hardware-accelerated AES tokens.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-[#171717] bg-[#050505] p-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Internal Gateway Isolation</div>
                  <div className="text-[#71717A] text-[11px] mt-0.5">
                    FastAPI listens exclusively on 127.0.0.1:8000. All inbound public traffic is reverse-proxied by Next.js on port $PORT.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-[#171717] bg-[#050505] p-3.5">
                <Clock className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Account Created</div>
                  <div className="text-[#71717A] text-[11px] mt-0.5">
                    {user?.created_at ? formatDate(user.created_at) : 'System Genesis'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREFERENCES */}
      {activeTab === 'account' && (
        <div className="rounded-xl border border-[#1A1A1A] bg-[#080808] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white">Console Display &amp; Architecture</h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#141414] pb-3">
              <div>
                <div className="font-medium text-white">Theme &amp; Contrast Mode</div>
                <div className="text-[11px] text-[#71717A]">
                  AMOLED Dark Engine (#000000) permanently active for OLED power efficiency.
                </div>
              </div>
              <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                AMOLED LOCKED
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#141414] pb-3">
              <div>
                <div className="font-medium text-white">Reverse Proxy Routing</div>
                <div className="text-[11px] text-[#71717A]">
                  All client API calls route through Next.js proxy rewrite layers.
                </div>
              </div>
              <span className="rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20 font-mono">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Remove Avatar Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeAvatarModalOpen}
        onClose={() => setRemoveAvatarModalOpen(false)}
        onConfirm={async () => {
          await removeAvatarMutation.mutateAsync();
        }}
        title="Remove Profile Photo"
        description="Are you sure you want to remove your profile photo? Your account will revert to standard monogram initials."
        confirmText="Remove Photo"
        cancelText="Cancel"
        isLoading={removeAvatarMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#71717A]">Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
