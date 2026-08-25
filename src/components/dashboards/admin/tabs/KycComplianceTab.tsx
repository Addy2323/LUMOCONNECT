'use client'

import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  FileCheck,
  Clock,
  Lock,
  RotateCcw,
  Eye,
  Download,
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

export function KycComplianceTab() {
  const { showToast } = useAdminToast()
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState('ALL')
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null)
  const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null)
  const [actionModal, setActionModal] = useState<{
    record: VerificationRecord
    action: 'APPROVE_KYC' | 'REJECT_KYC' | 'COMPLIANCE_HOLD' | 'REOPEN'
  } | null>(null)
  const [reason, setReason] = useState('')

  const loadData = () => {
    setRecords(listVerificationRecords())
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tinNumber.includes(searchQuery)
    const matchesKyc = kycFilter === 'ALL' || r.status === kycFilter
    return matchesSearch && matchesKyc
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

  const handleExecuteKycAction = () => {
    if (!actionModal || !reason.trim()) {
      showToast('error', 'Validation Error', 'A statutory compliance reason is mandatory.')
      return
    }
    const { record, action } = actionModal

    let newStatus: VerificationRecord['status'] = record.status
    if (action === 'APPROVE_KYC') newStatus = 'APPROVED'
    if (action === 'REJECT_KYC') newStatus = 'REJECTED'
    if (action === 'COMPLIANCE_HOLD') newStatus = 'SUSPENDED'
    if (action === 'REOPEN') newStatus = 'UNDER_REVIEW'

    updateVerificationRecordStatus(record.id, newStatus, reason, 'Super Administrator')
    loadData()

    showToast('success', `KYC Action: ${action}`, `Compliance action executed for ${record.businessName}. Reason: "${reason}".`)
    setActionModal(null)
    setReason('')
    if (selectedRecord?.id === record.id) {
      setSelectedRecord(null)
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>KYC & Identity Compliance Registry</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
              Identity Verification
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify National NIDA IDs, passports, business authorized representatives, preview uploaded statutory documents, and render compliance decisions.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>
            Pending Review: {records.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by legal name, NIDA ID, TIN, or applicant email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium cursor-pointer"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="SUBMITTED">Submitted (New)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved (Verified)</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended / On Hold</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">Applicant & Entity</th>
              <th className="p-3">Track / Sector</th>
              <th className="p-3">Statutory Files</th>
              <th className="p-3">Compliance Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                  No applicant verification records matching this filter.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{r.businessName}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.contactPerson} · {r.email} · {r.phone}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Reg: {r.registrationNumber} · TIN: {r.tinNumber}
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800">
                      {r.entityType} ({r.industry})
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {r.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                          <span className="truncate max-w-[130px] font-bold">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold shrink-0"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
                          ? 'bg-blue-100 text-blue-700'
                          : r.status === 'MORE_INFO_REQUIRED'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Inspect
                      </button>

                      {r.status !== 'APPROVED' && (
                        <button
                          onClick={() => setActionModal({ record: r, action: 'APPROVE_KYC' })}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {r.status !== 'REJECTED' && (
                        <button
                          onClick={() => setActionModal({ record: r, action: 'REJECT_KYC' })}
                          className="py-1 px-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {/* INSPECTION DETAIL MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedRecord.businessName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Reg: {selectedRecord.registrationNumber} · TIN: {selectedRecord.tinNumber}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Checklist & Download List */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                Uploaded Statutory Documents ({selectedRecord.documents.length}):
              </div>
              <div className="space-y-2">
                {selectedRecord.documents.map((doc, i) => (
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
                  setActionModal({ record: selectedRecord, action: 'APPROVE_KYC' })
                  setSelectedRecord(null)
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Approve Verification
              </button>

              <button
                onClick={() => {
                  setActionModal({ record: selectedRecord, action: 'REJECT_KYC' })
                  setSelectedRecord(null)
                }}
                className="py-2.5 px-4 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 cursor-pointer"
              >
                Reject Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION REASON MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF6A00]" />
              <span>Record KYC Decision: {actionModal.action}</span>
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Applicant: <strong>{actionModal.record.businessName}</strong> ({actionModal.record.email})
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Compliance Reason <span className="text-red-500">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                placeholder="State compliance reason (e.g. NIDA biometric record verified with official database)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteKycAction}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Sign & Save Decision
              </button>
              <button
                onClick={() => {
                  setActionModal(null)
                  setReason('')
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
