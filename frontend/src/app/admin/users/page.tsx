'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { User } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Users, PlusCircle, Trash2, Power, Shield, ShieldCheck, X } from 'lucide-react';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.getUsers();
      return (res.data || []) as User[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.createUser(newUser);
      if (!res.success) throw new Error(res.error?.message || 'Failed to create user');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateModalOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'user' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.updateUser(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Manage developer accounts, administrator privileges, and active statuses.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      <div className="rounded-xl border border-[#141414] bg-[#050505] overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse p-6 text-xs text-[#71717A]">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#71717A]">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#141414] bg-[#080808] text-[#71717A]">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101010] text-[#A1A1AA]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#080808] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{u.full_name || 'Anonymous User'}</div>
                      <div className="text-[10px] text-[#52525B] font-mono">{u.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-white text-xs">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {u.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#71717A] text-xs">{formatDate(u.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: u.id,
                              data: { is_active: !u.is_active },
                            })
                          }
                          title={u.is_active ? 'Deactivate User' : 'Activate User'}
                          className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-white"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete user '${u.email}'?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          title="Delete User"
                          className="rounded p-1 text-[#71717A] hover:bg-[#141414] hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1A1A1A] bg-[#050505] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
              <h3 className="text-base font-bold text-white">Create New User</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#71717A] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="developer@domain.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-1 font-medium">Platform Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full rounded-md border border-[#1A1A1A] bg-black px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="user">User (API Client)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#141414]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-md border border-[#1A1A1A] bg-[#0A0A0A] px-4 py-2 font-medium text-[#A1A1AA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
