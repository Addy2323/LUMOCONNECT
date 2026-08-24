'use client'

import React, { useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react'
import { useBusinessToast } from '../BusinessToast'

export function ReportsExportsTab() {
  const { showToast } = useBusinessToast()

  const [reports] = useState<
    {
      id: string
      title: string
      schedule: string
      format: string
      lastGenerated: string
    }[]
  >([])

  const handleDownload = (title: string) => {
    showToast('success', 'Report Exported', `"${title}" downloaded.`)
  }

  const handleGenerateOnDemand = (title: string) => {
    showToast('info', 'Generating Export', `Compiling data manifest for "${title}"...`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Performance Reports & Statutory Exports</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-2 py-0.5 rounded-full">
              Automated Data Exports
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and schedule automated performance, conversion, reward, and financial reconciliation exports.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-14 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Export Archive Cycles Run Yet</div>
          <div className="max-w-md mx-auto">
            Periodic partner commission statements, attribution audit manifests, and executive ROI reports generate automatically at the end of each billing cycle or upon conversion reconciliation.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {rep.title}
                </h4>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Schedule: {rep.schedule}</span>
                  <span>· Format: {rep.format}</span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(rep.title)}
                className="py-2 px-4 bg-[#0B132B] hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Download Export</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
