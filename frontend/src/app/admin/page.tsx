'use client'

import React from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { MOCK_USERS, getStoredAnalyses } from '@/services/mockDataService'
import { ShieldAlert, Server, Cpu, Database, Users, Activity, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const analyses = getStoredAnalyses()

  const systemMetrics = [
    { label: 'Backend API Server', status: 'ONLINE', latency: '18ms', icon: Server, color: 'text-emerald-500' },
    { label: 'ML Inference Model Engine', status: 'ONLINE', latency: '142ms', icon: Cpu, color: 'text-emerald-500' },
    { label: 'Database Storage Cluster', status: 'ONLINE', latency: '4ms', icon: Database, color: 'text-emerald-500' },
  ]

  const stats = [
    { label: 'Total Analyses Executed', value: analyses.length, sub: 'Across all registered accounts' },
    { label: 'Avg Inference Time', value: '2.1s', sub: 'Per signal recording' },
    { label: 'Model Confidence Avg', value: '88.4%', sub: 'High confidence threshold' },
    { label: 'Active Platform Users', value: MOCK_USERS.length, sub: 'Patient, Doctor & Admin accounts' },
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container-main">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-purple-100 text-purple-800 rounded-xl border border-purple-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Admin Control Center & AI Operations
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Real-time monitoring of backend API health, deep learning model latency, user accounts, and platform screening telemetry.
            </p>
          </div>

          {/* Action Buttons required for Admin */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/history"
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 transition-all"
            >
              System Audit Logs & History
            </Link>
          </div>
        </div>

        {/* System Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {systemMetrics.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="card border-l-4 border-l-emerald-500 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{item.label}</h3>
                    <span className="text-[10px] text-slate-400">Response time: {item.latency}</span>
                  </div>
                </div>

                <span className="badge-good flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {item.status}
                </span>
              </div>
            )
          })}
        </div>

        {/* Platform Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="card bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <span className="text-xs text-slate-500 block mb-1 font-bold">{s.label}</span>
              <p className="text-3xl font-extrabold text-[#00605b]">{s.value}</p>
              <span className="text-[10px] text-slate-600 font-semibold mt-1 block">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Registered Users Table */}
        <div className="card mb-8">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            User Account Management
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'doctor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="badge-good">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
