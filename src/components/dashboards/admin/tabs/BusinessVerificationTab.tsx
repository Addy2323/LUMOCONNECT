'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Search,
  FileCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Building,
  UserCheck,
  Download,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import {
  listVerificationRecords,
  updateVerificationRecordStatus,
  type VerificationRecord,
  type VerificationDocument,
} from '@/modules/identity/service'
import { useAdminToast } from '../AdminToast'

export function BusinessVerificationTab() {
  const { showToast } = useAdminToast()
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedItem, setSelectedItem] = useState<VerificationRecord | null>(null)
  const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null)
  const [decisionModal, setDecisionModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'REQUIRE_REVERIFY'
    item: VerificationRecord
  } | null>(null)
  const [decisionReason, setDecisionReason] = useState('')

  const loadData = () => {
    fetch('/api/admin/overview')
      .then((res) => res.json())
      .then((data) => {
        if (data.verifications && data.verifications.length > 0) {
          setVerifications(data.verifications)
        } else {
          setVerifications(listVerificationRecords())
        }
      })
      .catch(() => {
        setVerifications(listVerificationRecords())
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredItems = verifications.filter((v) => {
    const matchesSearch =
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tinNumber.includes(searchQuery) ||
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDownloadDoc = (doc: VerificationDocument) => {
    if (doc.previewUrl) {
      const a = document.createElement('a')
      a.href = doc.previewUrl
      a.download = doc.name || 'verification_document.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      showToast('success', 'Document Downloaded', `Downloaded ${doc.name} successfully.`)
    } else {
      // Generate synthetic document for download if binary is text
      const blob = new Blob([`LUMO VERIFICATION RECORD\nDocument: ${doc.name}\nType: ${doc.type}\nStatus: ${doc.status}\nUploaded: ${doc.uploadedAt}`], {
        type: 'text/plain;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name || 'document'}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('success', 'Document Downloaded', `Downloaded ${doc.name}.`)
    }
  }

  const handleExecuteDecision = async () => {
    if (!decisionModal || !decisionReason.trim()) {
      showToast('error', 'Validation Error', 'A formal compliance decision reason is mandatory.')
      return
    }
    const { type, item } = decisionModal

    let newStatus: VerificationRecord['status'] = item.status
    if (type === 'APPROVE') newStatus = 'APPROVED'
    if (type === 'REJECT') newStatus = 'REJECTED'
    if (type === 'REQUEST_INFO') newStatus = 'MORE_INFO_REQUIRED'
    if (type === 'SUSPEND') newStatus = 'SUSPENDED'
    if (type === 'REQUIRE_REVERIFY') newStatus = 'UNDER_REVIEW'

    // Optimistic UI state update so badge changes immediately
    setVerifications((prev) =>
      prev.map((v) => (v.id === item.id ? { ...v, status: newStatus } : v))
    )

    updateVerificationRecordStatus(item.id, newStatus, decisionReason, 'Super Administrator')

    try {
      const res = await fetch('/api/admin/verifications/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: item.id,
          action: type,
          reason: decisionReason,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.warn('Failed to persist decision to DB:', err)
      }
    } catch (err) {
      console.warn('Network error persisting decision:', err)
    }

    showToast('success', `KYB Decision: ${type}`, `Compliance decision recorded for ${item.businessName}. Reason: "${decisionReason}".`)
    setDecisionModal(null)
    setDecisionReason('')
    if (selectedItem?.id === item.id) {
      setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Business KYB & Partner Verification</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Compliance Review Queue
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect BRELA incorporation certificates, TRA TIN documents, director IDs, and render compliance decisions.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>
            Pending Decisions:{' '}
            {verifications.filter((v) => v.status === 'SUBMITTED' || v.status === 'UNDER_REVIEW').length}
          </span>
        </div>
      </div>

      {/* Lifecycle Flow Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
        <span className="font-bold text-slate-900 dark:text-white">Review Pipeline:</span>
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded font-bold">1. Submitted</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded font-bold">2. Under Review</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded font-bold">3. More Info Required</span>
        <span>→</span>
        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded font-bold">4. Approved</span>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by legal entity name, TIN, BRELA number, or applicant email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium cursor-pointer"
          >
            <option value="ALL">All Verification States</option>
            <option value="SUBMITTED">Submitted (New Submissions)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="MORE_INFO_REQUIRED">More Info Required</option>
            <option value="APPROVED">Approved (Verified)</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid of Verification Cases */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-dashed text-xs text-slate-500 space-y-2">
          <Building className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
          <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Verification Submissions In Queue</div>
          <div className="max-w-md mx-auto">
            When new enterprises or partners complete KYC/KYB registration and attach their statutory files, their cases immediately queue here for inspection, document download, and compliance sign-off.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                selectedItem?.id === item.id
                  ? 'border-[#FF6A00] ring-2 ring-orange-500/20 bg-orange-50/10 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                        {item.businessName}
                      </h3>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        BRELA: {item.registrationNumber} · TIN: {item.tinNumber}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      item.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-700'
                        : item.status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-700'
                        : item.status === 'MORE_INFO_REQUIRED'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Representative:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Submitted:</span>
                    <span className="text-slate-500 font-mono text-[10px]">{item.submittedAt}</span>
                  </div>
                </div>

                {/* Documents preview strip */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Attached Statutory Files ({item.documents.length}):
                  </div>
                  <div className="space-y-1">
                    {item.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 px-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <FileText className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                            {doc.name}
                          </span>
                          <span className="text-[9px] text-slate-400 shrink-0">({doc.fileSize})</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="p-1 text-slate-500 hover:text-[#FF6A00] rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-1 flex-1 justify-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect KYB</span>
                </button>

                <button
                  onClick={() => setDecisionModal({ type: 'APPROVE', item })}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Approve
                </button>

                <button
                  onClick={() => setDecisionModal({ type: 'REQUEST_INFO', item })}
                  className="py-1.5 px-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 cursor-pointer"
                  title="Request Information"
                >
                  Need Info
                </button>

                <button
                  onClick={() => setDecisionModal({ type: 'REJECT', item })}
                  className="py-1.5 px-2.5 border border-red-200 dark:border-red-800 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer"
                  title="Reject"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {previewDoc.name}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Type: {previewDoc.type} · Size: {previewDoc.fileSize}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Render Area */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[260px] overflow-hidden">
              {previewDoc.previewUrl && previewDoc.previewUrl.startsWith('data:image') ? (
                <img
                  src={previewDoc.previewUrl}
                  alt={previewDoc.name}
                  className="max-h-[380px] max-w-full object-contain rounded-xl shadow-xs"
                />
              ) : previewDoc.previewUrl && previewDoc.previewUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.previewUrl}
                  title={previewDoc.name}
                  className="w-full h-[380px] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center space-y-3 py-8">
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-[#FF6A00] opacity-80" />
                  <div className="space-y-1">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {previewDoc.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Encrypted Statutory Document Payload ({previewDoc.fileSize})
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDoc(previewDoc)}
                    className="py-2 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full File to Inspect</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDownloadDoc(previewDoc)}
                className="py-2 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Original File</span>
              </button>

              <button
                onClick={() => setPreviewDoc(null)}
                className="py-2 px-4 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYB INSPECTION DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-black">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedItem.businessName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    BRELA: {selectedItem.registrationNumber} · TIN: {selectedItem.tinNumber}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Verification Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-400 font-bold">Industry Sector</div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedItem.industry}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-400 font-bold">Contact Representative</div>
                <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedItem.contactPerson}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-400 font-bold">Status</div>
                <div className="font-extrabold text-emerald-600 mt-0.5">{selectedItem.status}</div>
              </div>
            </div>

            {/* Document Checklist & Download List */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                Uploaded Statutory Documents for Compliance Sign-Off:
              </div>
              <div className="space-y-2">
                {selectedItem.documents.map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                      <FileCheck className="w-5 h-5 text-[#FF6A00] shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {doc.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.type} · {doc.fileSize}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="py-1.5 px-3 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold rounded-xl hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="py-1.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setDecisionModal({ type: 'APPROVE', item: selectedItem })
                  setSelectedItem(null)
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Approve KYB Case
              </button>

              <button
                onClick={() => {
                  setDecisionModal({ type: 'REQUEST_INFO', item: selectedItem })
                  setSelectedItem(null)
                }}
                className="py-2.5 px-4 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-xl text-xs hover:bg-amber-100 cursor-pointer"
              >
                Request More Information
              </button>

              <button
                onClick={() => {
                  setDecisionModal({ type: 'REJECT', item: selectedItem })
                  setSelectedItem(null)
                }}
                className="py-2.5 px-4 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECISION MODAL WITH MANDATORY REASON */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF6A00]" />
              <span>Record KYB Decision: {decisionModal.type}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Target Company: <strong>{decisionModal.item.businessName}</strong> (TIN: {decisionModal.item.tinNumber})
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Compliance Decision Reason <span className="text-red-500">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                placeholder="State statutory reason (e.g. BRELA certificate authenticated with online register, valid director ID matches TIN)..."
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteDecision}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Sign & Save Decision
              </button>
              <button
                onClick={() => {
                  setDecisionModal(null)
                  setDecisionReason('')
                }}
                className="py-2.5 px-4 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
