'use client'

import React, { useState } from 'react'
import {
  Folder,
  FileText,
  Lock,
  Download,
  Eye,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'

export interface DataRoomFolderItem {
  id: string
  folderNumber: string
  name: string
  documentsCount: number
  accessLevel: 'PUBLIC' | 'PRIVATE_MEMBER' | 'VERIFIED_INVESTOR' | 'APPROVED_INVESTOR' | 'ADMIN'
}

const DEFAULT_FOLDERS: DataRoomFolderItem[] = [
  { id: '1', folderNumber: '01', name: '01 Executive Summary & Teaser', documentsCount: 2, accessLevel: 'PUBLIC' },
  { id: '2', folderNumber: '02', name: '02 Legal & Corporate Governance', documentsCount: 5, accessLevel: 'VERIFIED_INVESTOR' },
  { id: '3', folderNumber: '03', name: '03 Audited Financials & Tax Filings', documentsCount: 8, accessLevel: 'VERIFIED_INVESTOR' },
  { id: '4', folderNumber: '04', name: '04 Financial Model & Valuation Memo', documentsCount: 3, accessLevel: 'APPROVED_INVESTOR' },
  { id: '5', folderNumber: '05', name: '05 Licenses, Land & Environmental Permits', documentsCount: 4, accessLevel: 'VERIFIED_INVESTOR' },
  { id: '6', folderNumber: '06', name: '06 Technical, EPC & Operational Reports', documentsCount: 6, accessLevel: 'VERIFIED_INVESTOR' },
  { id: '7', folderNumber: '07', name: '07 Offtake Agreements & Commercial Contracts', documentsCount: 3, accessLevel: 'APPROVED_INVESTOR' },
  { id: '8', folderNumber: '08', name: '08 ESG, Carbon & Community Impact', documentsCount: 2, accessLevel: 'PUBLIC' },
  { id: '9', folderNumber: '09', name: '09 Term Sheet & Closing Documents', documentsCount: 1, accessLevel: 'APPROVED_INVESTOR' },
]

interface DataRoomViewProps {
  opportunityTitle?: string
  isNdaSigned?: boolean
  onSignNdaRequest?: () => void
  onBack?: () => void
}

export function DataRoomView({
  opportunityTitle = 'Solar Microgrid Hybrid Expansion Deal',
  isNdaSigned = false,
  onSignNdaRequest,
  onBack,
}: DataRoomViewProps) {
  const [selectedFolder, setSelectedFolder] = useState<DataRoomFolderItem | null>(null)

  return (
    <div className="w-full bg-slate-900 text-white min-h-[80vh] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunity Catalog
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-[#FF6A00] border border-orange-500/30">
              LUMO SECURE DATA ROOM
            </span>
            {isNdaSigned && (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                NDA Executed
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-2">{opportunityTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          {!isNdaSigned && (
            <button
              onClick={onSignNdaRequest}
              className="px-5 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign NDA for Full Access
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Folder List vs Document Reader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Folder Hierarchy Column */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Data Room Folders</span>
            <span className="text-[11px] text-slate-500">9 Folders</span>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {DEFAULT_FOLDERS.map((folder) => {
              const isSelected = selectedFolder?.id === folder.id
              const isLocked = !isNdaSigned && folder.accessLevel !== 'PUBLIC'

              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-orange-500/10 border-[#FF6A00] text-white'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#FF6A00]' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded-md text-slate-400">
                        {folder.documentsCount} files
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Folder Document Details */}
        <div className="md:col-span-2 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between min-h-[400px]">
          {selectedFolder ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#FF6A00]" />
                    {selectedFolder.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Security Level: <span className="font-mono text-orange-400">{selectedFolder.accessLevel}</span>
                  </p>
                </div>

                {!isNdaSigned && selectedFolder.accessLevel !== 'PUBLIC' && (
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    NDA Required
                  </div>
                )}
              </div>

              {!isNdaSigned && selectedFolder.accessLevel !== 'PUBLIC' ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Confidential Folder Locked</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To access legal contracts, financial models, and diligence files in this folder, you must execute the LUMO Non-Disclosure Agreement.
                  </p>
                  <button
                    onClick={onSignNdaRequest}
                    className="px-5 py-2 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Execute NDA to Unlock
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Document_Dossier_2026_Final.pdf</div>
                        <div className="text-[10px] text-slate-500 font-mono">2.4 MB • Updated yesterday</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="m-auto text-center space-y-2 py-12">
              <Folder className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-400">Select a folder on the left to inspect documents</div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>🔒 Watermarked PDF viewing enabled</span>
            <span>All downloads logged with IP verification</span>
          </div>
        </div>
      </div>
    </div>
  )
}
