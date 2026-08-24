'use client'

import React, { useState } from 'react'
import {
  GraduationCap,
  CheckCircle2,
  PlayCircle,
  Award,
  Clock,
  Download,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { usePartnerToast } from '../PartnerToast'

export function TrainingCenterTab() {
  const { showToast } = usePartnerToast()

  const [courses, setCourses] = useState([
    {
      id: 'crs_1',
      title: 'LUMO Partner Compliance & Fair Dealing Standard',
      duration: '45 mins',
      modulesCount: 4,
      completedModules: 0,
      isCompleted: false,
      badge: 'Certified Compliant Seller',
    },
    {
      id: 'crs_2',
      title: 'Commercial B2B Introduction & Contract Negotiation',
      duration: '1 hr 15 mins',
      modulesCount: 6,
      completedModules: 0,
      isCompleted: false,
      badge: 'B2B Dealmaker Certificate',
    },
    {
      id: 'crs_3',
      title: 'Digital Social Creator Marketing & UTM Tracking',
      duration: '30 mins',
      modulesCount: 3,
      completedModules: 0,
      isCompleted: false,
      badge: 'Growth Influencer Badge',
    },
  ])

  const handleStartCourse = (title: string) => {
    showToast('info', 'Masterclass Opened', `Starting training curriculum for "${title}".`)
  }

  const handleDownloadCert = (badge: string) => {
    showToast('success', 'Certificate Downloaded', `Official PDF certificate for "${badge}" downloaded.`)
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Partner Academy & Training Center</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
              Learning Curriculum
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete compliance masterclasses, master B2B negotiation, and earn verified seller badges.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {courses.map((crs) => (
          <div
            key={crs.id}
            className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    crs.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {crs.isCompleted ? '✓ Completed' : 'Not Started'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{crs.duration}</span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {crs.title}
              </h3>

              <div className="text-xs text-slate-500">
                Progress: {crs.completedModules} of {crs.modulesCount} modules finished · Award: <strong>{crs.badge}</strong>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {crs.isCompleted ? (
                <button
                  onClick={() => handleDownloadCert(crs.badge)}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStartCourse(crs.title)}
                  className="py-2 px-3.5 bg-[#FF6A00] hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start Masterclass</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
