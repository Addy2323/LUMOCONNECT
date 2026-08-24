'use client'

import React, { useState } from 'react'
import {
  Activity,
  X,
  ShieldCheck,
  Server,
  Database,
  Wallet,
  Mail,
  Zap,
  Clock,
  AlertTriangle,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface SystemStatusModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserRole?: string
}

export function SystemStatusModal({
  isOpen,
  onClose,
  currentUserRole = 'SUPER_ADMIN',
}: SystemStatusModalProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [showConfirmMaintenance, setShowConfirmMaintenance] = useState(false)
  const [acknowledgedIncidents, setAcknowledgedIncidents] = useState<string[]>([])
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString())

  if (!isOpen) return null

  const isTechAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'TECHNICAL_ADMIN'

  const services = [
    {
      name: 'Core GraphQL & REST API',
      category: 'API Services',
      status: 'OPERATIONAL',
      uptime: '99.99%',
      latency: '34ms',
      icon: Server,
    },
    {
      name: 'PostgreSQL Primary Cluster (Tanzania DC)',
      category: 'Database',
      status: 'OPERATIONAL',
      uptime: '99.98%',
      latency: '4ms',
      icon: Database,
    },
    {
      name: 'Vodacom M-Pesa B2C Open API Gateway',
      category: 'Payment Provider',
      status: 'OPERATIONAL',
      uptime: '99.92%',
      latency: '142ms',
      icon: Wallet,
    },
    {
      name: 'Tigo Pesa Merchant STK Gateway',
      category: 'Payment Provider',
      status: 'OPERATIONAL',
      uptime: '99.85%',
      latency: '168ms',
      icon: Wallet,
    },
    {
      name: 'Airtel Money & HaloPesa Aggregator',
      category: 'Payment Provider',
      status: 'OPERATIONAL',
      uptime: '99.70%',
      latency: '210ms',
      icon: Wallet,
    },
    {
      name: 'CRDB & NMB Bank Host-to-Host (H2H)',
      category: 'Banking Gateway',
      status: 'OPERATIONAL',
      uptime: '99.95%',
      latency: '85ms',
      icon: Wallet,
    },
    {
      name: 'SMS Gateway (Infobip / Local Telcos)',
      category: 'Communications',
      status: 'OPERATIONAL',
      uptime: '99.90%',
      latency: '620ms',
      icon: Mail,
    },
    {
      name: 'Transactional Email (Amazon SES)',
      category: 'Communications',
      status: 'OPERATIONAL',
      uptime: '100.0%',
      latency: '180ms',
      icon: Mail,
    },
    {
      name: 'Asynchronous Background Jobs & BullMQ',
      category: 'Worker Queue',
      status: 'OPERATIONAL',
      uptime: '99.99%',
      latency: '0ms delay',
      icon: Zap,
    },
  ]

  const metrics = [
    { label: 'Overall 30-Day Uptime', value: '99.98%', status: 'optimal' },
    { label: 'Platform Error Rate', value: '0.012%', status: 'optimal' },
    { label: 'Webhook Queue Delay', value: '0.4s', status: 'optimal' },
    { label: 'Last Successful Backup', value: 'Today, 04:00 AM (Encrypted offsite)', status: 'info' },
  ]

  const activeIncidents = [
    {
      id: 'inc_01',
      title: 'Airtel Money gateway intermittent timeout during peak hours (18:00 - 19:00 EAT)',
      severity: 'LOW',
      time: 'Logged yesterday',
    },
  ]

  const handleToggleMaintenance = () => {
    if (!isTechAdmin) return
    setMaintenanceMode(!maintenanceMode)
    setShowConfirmMaintenance(false)
  }

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIncidents((prev) => [...prev, id])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Platform System Health & Monitoring</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                  Read/Monitor
                </span>
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Refreshed at {lastRefreshed}</span>
                <button
                  onClick={() => setLastRefreshed(new Date().toLocaleTimeString())}
                  className="hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-bold text-orange-600"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 4 Real-time KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700"
            >
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                {m.label}
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Maintenance Mode Control Banner */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                maintenanceMode ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <span>Platform Maintenance Mode</span>
                {maintenanceMode && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-extrabold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {isTechAdmin
                  ? 'Only authorized Technical Administrators can engage maintenance mode.'
                  : 'Restricted: Requires Technical Administrator permissions.'}
              </div>
            </div>
          </div>

          {isTechAdmin && (
            <button
              onClick={() => setShowConfirmMaintenance(true)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs ${
                maintenanceMode
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800'
              }`}
            >
              {maintenanceMode ? 'Disable Maintenance' : 'Toggle Maintenance Mode'}
            </button>
          )}
        </div>

        {/* Confirmation prompt */}
        {showConfirmMaintenance && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Confirm {maintenanceMode ? 'Disabling' : 'Enabling'} Platform Maintenance Mode?
              </span>
            </div>
            <p className="text-[11px] text-red-600 dark:text-red-400">
              This will block all public marketplace transactions and show a maintenance page to visitors and partners.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleToggleMaintenance}
                className="py-1.5 px-3 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                Confirm State Change
              </button>
              <button
                onClick={() => setShowConfirmMaintenance(false)}
                className="py-1.5 px-3 border border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Incident Alerts Panel */}
        {activeIncidents.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Active Incident Log
            </h3>
            {activeIncidents.map((inc) => {
              const isAck = acknowledgedIncidents.includes(inc.id)
              return (
                <div
                  key={inc.id}
                  className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inc.title}
                      </div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-400">
                        {inc.time} · Severity: {inc.severity}
                      </div>
                    </div>
                  </div>

                  {isAck ? (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      className="py-1 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Node & Service Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Node Status & Provider Health
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.name}
                  className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                      Latency: {s.latency}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {s.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
          >
            Close Status Monitor
          </button>
        </div>
      </div>
    </div>
  )
}
