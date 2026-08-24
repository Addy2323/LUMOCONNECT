'use client'

import React, { useState } from 'react'
import {
  Building,
  Plus,
  CheckCircle2,
  Download,
  Smartphone,
  CreditCard,
  Trash2,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react'
import { MOCK_PAYOUT_METHODS } from '../mockData'
import { PartnerPayoutMethod } from '../types'
import { usePartnerToast } from '../PartnerToast'

export function PayoutMethodsTaxTab() {
  const { showToast } = usePartnerToast()

  const [methods, setMethods] = useState<PartnerPayoutMethod[]>(MOCK_PAYOUT_METHODS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMethod, setNewMethod] = useState({
    type: 'VODACOM_MPESA' as PartnerPayoutMethod['type'],
    accountTitle: '',
    accountNumber: '',
  })

  const handleSetDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    )
    showToast('success', 'Default Payout Method Updated', 'New default account selected for weekly disbursements.')
  }

  const handleAddMethod = () => {
    if (!newMethod.accountTitle.trim() || !newMethod.accountNumber.trim()) {
      showToast('error', 'Validation Error', 'Account title and number are required.')
      return
    }

    const created: PartnerPayoutMethod = {
      id: `pm_${Date.now()}`,
      type: newMethod.type,
      accountTitle: newMethod.accountTitle,
      accountNumberMasked: `${newMethod.accountNumber.slice(0, 4)} *** ${newMethod.accountNumber.slice(-3)}`,
      isDefault: methods.length === 0,
      isVerified: true,
    }

    setMethods([...methods, created])
    setShowAddModal(false)
    setNewMethod({ type: 'VODACOM_MPESA', accountTitle: '', accountNumber: '' })
    showToast('success', 'Payout Destination Added', 'New verified account added to your disbursement roster.')
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Payout Accounts & TRA Tax Certificates</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">
              Disbursement Accounts
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your verified mobile money and bank payout accounts, and download statutory withholding certificates.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-all active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payout Method</span>
        </button>
      </div>

      {/* Methods List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Active Verified Disbursement Accounts
        </h3>

        {methods.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs text-slate-500">
            <Smartphone className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <div className="font-bold text-slate-700 dark:text-slate-300">No Payout Destination Configured</div>
            <div className="mt-0.5">Click &quot;Add Payout Method&quot; above to link your Vodacom M-Pesa, Tigo Pesa, Airtel Money, or Bank Account.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {methods.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[10px] uppercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                      {m.type.replace(/_/g, ' ')}
                    </span>
                    {m.isDefault && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        ✓ Default Payout Destination
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                    {m.accountTitle}
                  </h4>
                  <div className="font-mono text-slate-500 text-xs">{m.accountNumberMasked}</div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Verified</span>
                  {!m.isDefault && (
                    <button
                      onClick={() => handleSetDefault(m.id)}
                      className="text-xs text-[#FF6A00] hover:underline font-bold cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRA Tax Statements Section */}
      <div className="space-y-3 pt-3 border-t">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
          Statutory TRA Withholding Tax Statements
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-xs text-slate-500 text-center py-6">
          <FileText className="w-7 h-7 mx-auto text-slate-400 mb-2" />
          <div className="font-bold text-slate-700 dark:text-slate-300">No Tax Withholding Statements Yet</div>
          <div className="mt-0.5">Statutory TRA withholding certificates are automatically compiled and issued upon completing taxable reward disbursements.</div>
        </div>
      </div>

      {/* Add Payout Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF6A00]" />
              <span>Link Payout Destination</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Disbursement Channel
                </label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="VODACOM_MPESA">Vodacom M-Pesa</option>
                  <option value="TIGO_PESA">Tigo Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="CRDB_BANK">CRDB Bank</option>
                  <option value="NMB_BANK">NMB Bank</option>
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Registered Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mwamburi"
                  value={newMethod.accountTitle}
                  onChange={(e) => setNewMethod({ ...newMethod, accountTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number or Bank Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0754112233 or 0150..."
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddMethod}
                className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Save & Verify Account
              </button>
              <button
                onClick={() => setShowAddModal(false)}
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
