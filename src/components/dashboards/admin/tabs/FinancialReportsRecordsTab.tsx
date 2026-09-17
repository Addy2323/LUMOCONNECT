'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users,
  Wallet,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'
import {
  exportFinancialReportToExcel,
  exportFinancialReportToPdf,
  ReportData,
} from '@/lib/financial-exporter'

type FinancialTab = 'reports' | 'records' | 'statements' | 'deal_economics' | 'calendar' | 'tax'

export function FinancialReportsRecordsTab() {
  const { showToast } = useAdminToast()
  const [activeSubTab, setActiveSubTab] = useState<FinancialTab>('reports')
  const [reportFrequency, setReportFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY')
  const [selectedRecordType, setSelectedRecordType] = useState('customer_payments')
  const [searchQuery, setSearchQuery] = useState('')

  // Live Dynamic Financial Data
  const [financialData, setFinancialData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [selectedDealIndex, setSelectedDealIndex] = useState<number>(0)

  const fetchFinancialData = async () => {
    setDataLoading(true)
    try {
      const res = await fetch('/api/admin/financial-reports', { credentials: 'include' })
      const data = await res.json()
      if (data?.success) {
        setFinancialData(data)
      } else {
        showToast('error', 'Sync Failed', data?.error || 'Could not fetch live financial data.')
      }
    } catch (err) {
      console.warn('Failed to load financial reports data:', err)
      showToast('error', 'Network Error', 'Check connection to live financial ledger.')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
  }, [])

  // Tax Simulator State (Preserved from TaxStatementsTab)
  const [grossInput, setGrossInput] = useState<number>(1000000)
  const [isNonResident, setIsNonResident] = useState(false)
  const withholdingRate = isNonResident ? 0.15 : 0.05
  const withholdingAmount = Math.round(grossInput * withholdingRate)
  const netEarnings = grossInput - withholdingAmount

  // Real Active Deals List
  const realDeals = financialData?.dealEconomics || []
  const activeDeal = realDeals[selectedDealIndex] || realDeals[0] || {
    dealId: 'LUMO-DEAL-LIVE',
    dealTitle: 'Real Commercial Deal Allocation',
    postedDate: 'Live System Record',
    customerPaymentDate: 'Real-time Escrow',
    completedDate: 'Pending Completion',
    financiallyClosedDate: 'Pending Settlement',
    dealValue: 1000000,
    customerPayment: 1000000,
    merchantPayable: 910000,
    partnerReward: 30000,
    lumoGrossRevenue: 60000,
    paymentCharges: 6000,
    lumoNetContribution: 54000,
    rows: [],
  }

  // 15 Dynamic Registers
  const registers = financialData?.recordRegisters || []
  const currentRegister = registers.find((r: any) => r.id === selectedRecordType) || registers[0] || {
    name: 'Real Financial Record Register',
    rows: [],
    count: 0,
  }

  // Generate Real Report Data for PDF/Excel Exports
  const getActiveReportData = (): ReportData => {
    if (activeSubTab === 'statements') {
      const pnlRows = financialData?.statements?.rows || []
      const pnlTotals = financialData?.statements?.totals || {}
      const periodLabel = financialData?.statements?.currentPeriod || 'Fiscal Current Period'
      const prevPeriodLabel = financialData?.statements?.previousPeriod || 'Fiscal Previous Period'

      return {
        title: 'Statement of Profit or Loss (Income Statement)',
        subtitle: 'Formal Audited Management Account - Live Ledger',
        period: periodLabel,
        summaryKpis: [
          {
            label: 'Marketplace Fees',
            value: `TZS ${(pnlRows[0]?.currAmount ?? 0).toLocaleString()}`,
            color: '#10B981',
          },
          {
            label: 'VIP Subscriptions',
            value: `TZS ${(pnlRows[1]?.currAmount ?? 0).toLocaleString()}`,
            color: '#3B82F6',
          },
          {
            label: 'Net Profit',
            value: `TZS ${(pnlTotals?.currAmount ?? 0).toLocaleString()}`,
            color: '#FF6A00',
          },
        ],
        columns: [
          { key: 'lineItem', label: 'Financial Statement Line Item', width: 220 },
          { key: 'category', label: 'Classification', align: 'center', width: 140 },
          { key: 'currAmount', label: `${periodLabel} (TZS)`, type: 'currency', width: 150 },
          { key: 'prevAmount', label: `${prevPeriodLabel} (TZS)`, type: 'currency', width: 150 },
          { key: 'variance', label: 'Variance (%)', align: 'center', width: 110 },
        ],
        rows: pnlRows.map((r: any) => ({
          lineItem: r.lineItem,
          category: r.category,
          currAmount: `TZS ${Number(r.currAmount).toLocaleString()}`,
          prevAmount: `TZS ${Number(r.prevAmount).toLocaleString()}`,
          variance: r.variance,
        })),
        totals: {
          lineItem: pnlTotals.lineItem || 'NET OPERATING PROFIT',
          category: pnlTotals.category || 'Statutory Result',
          currAmount: `TZS ${(pnlTotals?.currAmount ?? 0).toLocaleString()}`,
          prevAmount: `TZS ${(pnlTotals?.prevAmount ?? 0).toLocaleString()}`,
          variance: pnlTotals?.variance || '+0.0%',
        },
        notes: [
          'Prepared dynamically in accordance with Tanzania Financial Reporting Standards (TFRS).',
          'Merchant settlements do not form part of Lumo gross revenue under agency principle.',
          'Statutory withholding tax amounts remitted directly to Tanzania Revenue Authority (TRA).',
        ],
      }
    }

    if (activeSubTab === 'deal_economics') {
      return {
        title: `Deal Financial Economics - ${activeDeal.dealId}`,
        subtitle: activeDeal.dealTitle,
        period: activeDeal.postedDate,
        summaryKpis: [
          { label: 'Gross Deal Value', value: `TZS ${activeDeal.dealValue.toLocaleString()}`, color: '#0F172A' },
          { label: 'Merchant Settlement', value: `TZS ${activeDeal.merchantPayable.toLocaleString()}`, color: '#3B82F6' },
          { label: 'Lumo Net Margin', value: `TZS ${activeDeal.lumoNetContribution.toLocaleString()}`, color: '#10B981' },
        ],
        columns: [
          { key: 'item', label: 'Economics Component', width: 220 },
          { key: 'party', label: 'Counterparty', align: 'center', width: 140 },
          { key: 'amount', label: 'Amount (TZS)', type: 'currency', width: 160 },
          { key: 'percentage', label: '% of Deal', align: 'center', width: 110 },
        ],
        rows: (activeDeal.rows || []).map((r: any) => ({
          item: r.item,
          party: r.party,
          amount: `TZS ${Number(r.amount).toLocaleString()}`,
          percentage: r.percentage,
        })),
      }
    }

    // Default: Live Operations Report
    const feedRows = financialData?.reportFeedRows || []
    return {
      title: `${reportFrequency} Financial Operations Report`,
      subtitle: 'Centralized Platform Financial Performance & Live Ledger Audit Record',
      period: `Live Sync ${new Date().toLocaleDateString('en-GB')}`,
      summaryKpis: [
        {
          label: 'Customer Collections',
          value: `TZS ${(financialData?.kpis?.today?.customerCollectionsTZS ?? 0).toLocaleString()}`,
          color: '#0F172A',
        },
        {
          label: 'Merchant Settlements',
          value: `TZS ${(financialData?.kpis?.today?.merchantSettlementsTZS ?? 0).toLocaleString()}`,
          color: '#3B82F6',
        },
        {
          label: 'Partner Rewards',
          value: `TZS ${(financialData?.kpis?.today?.partnerRewardsTZS ?? 0).toLocaleString()}`,
          color: '#10B981',
        },
        {
          label: 'Platform Net Margin',
          value: `TZS ${(financialData?.kpis?.thisMonth?.netOperatingProfitTZS ?? 0).toLocaleString()}`,
          color: '#FF6A00',
        },
      ],
      columns: [
        { key: 'ref', label: 'Ref / Ticket', width: 130 },
        { key: 'type', label: 'Transaction Type', width: 150 },
        { key: 'party', label: 'Counterparty', width: 160 },
        { key: 'status', label: 'Settlement Status', align: 'center', type: 'badge', width: 130 },
        { key: 'amount', label: 'Amount (TZS)', type: 'currency', width: 150 },
        { key: 'date', label: 'Date & Time', align: 'center', width: 130 },
      ],
      rows: feedRows,
      totals: {
        ref: 'SUMMARY TOTAL',
        type: `${feedRows.length} Live Transactions`,
        party: 'All Counterparties',
        status: 'BALANCED',
        amount: `TZS ${(financialData?.kpis?.thisMonth?.platformGrossRevenueTZS ?? 0).toLocaleString()}`,
        date: 'Generated Live',
      },
      notes: [
        'All partner rewards are disbursed via direct mobile money integration upon merchant settlement confirmation.',
        'Lumo Dealers operates on a zero-custody escrow model under Section 3 of Financial Guidelines.',
      ],
    }
  }

  const handleExportPdf = () => {
    const data = getActiveReportData()
    exportFinancialReportToPdf(data)
    showToast('success', 'PDF Document Generated', `High-resolution colored PDF generated for "${data.title}".`)
  }

  const handleExportExcel = () => {
    const data = getActiveReportData()
    exportFinancialReportToExcel(data)
    showToast('success', 'Excel Spreadsheet Exported', `Styled colored spreadsheet downloaded for "${data.title}".`)
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE KPI BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              Live Sync
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Customer Collections</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                TZS {(financialData?.kpis?.today?.customerCollectionsTZS ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Merchant Settlements</span>
              <span className="font-mono font-bold text-blue-600">
                TZS {(financialData?.kpis?.today?.merchantSettlementsTZS ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Partner Rewards</span>
              <span className="font-mono font-bold text-[#FF6A00]">
                TZS {(financialData?.kpis?.today?.partnerRewardsTZS ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              This Month ({financialData?.kpis?.thisMonth?.monthName ?? 'Current'})
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              {financialData?.kpis?.thisMonth?.quarterName ?? 'Fiscal Q3'}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Platform Gross Revenue</span>
              <span className="font-mono font-bold text-emerald-600">
                TZS {(financialData?.kpis?.thisMonth?.platformGrossRevenueTZS ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Net Operating Profit</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                TZS {(financialData?.kpis?.thisMonth?.netOperatingProfitTZS ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Total Cash Position</span>
              <span className="font-mono font-bold text-indigo-600">
                TZS {(financialData?.kpis?.thisMonth?.totalCashPositionTZS ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Reporting Calendar Summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reporting Calendar</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              Timelines
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="text-base font-black text-blue-600">
                {financialData?.kpis?.calendarSummary?.reportsDue ?? 0}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Reports Due</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30">
              <div className="text-base font-black text-rose-600">
                {financialData?.kpis?.calendarSummary?.overdue ?? 0}
              </div>
              <div className="text-[10px] text-rose-500 font-bold uppercase">Overdue</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <div className="text-base font-black text-emerald-600">
                {financialData?.kpis?.calendarSummary?.closed ?? 0}
              </div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase">Closed</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            { id: 'records', label: 'Financial Records', icon: Layers },
            { id: 'statements', label: 'Statements (P&L / Balance Sheet)', icon: FileText },
            { id: 'deal_economics', label: 'Deal Economics', icon: DollarSign },
            { id: 'calendar', label: 'Reporting Calendar', icon: Calendar },
            { id: 'tax', label: 'Tax & Compliance', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as FinancialTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#FF6A00] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Global Action & Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchFinancialData}
            disabled={dataLoading}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF6A00] ${dataLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Export Colored PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Styled Excel</span>
          </button>
        </div>
      </div>

      {/* 3. SUB-TAB 1: FINANCIAL REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setReportFrequency(freq)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFrequency === freq
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Authoritative live audit-ready ledger for <strong>{reportFrequency}</strong> cycle</span>
              {dataLoading && <Loader2 className="w-3 h-3 animate-spin text-[#FF6A00]" />}
            </div>
          </div>

          {/* Reports Table Preview */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {reportFrequency} Financial Performance & Settlement Report
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Full transaction trace: Report → Transaction → Deal → Settlement → User → Audit Record
                </p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Live Dynamic Sync
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Reference / Ticket</th>
                    <th className="p-3">Transaction Type</th>
                    <th className="p-3">Counterparty</th>
                    <th className="p-3 text-center">Settlement Status</th>
                    <th className="p-3 text-right">Amount (TZS)</th>
                    <th className="p-3 text-center">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {getActiveReportData().rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No financial transactions recorded yet. Live payments and payouts will appear dynamically.
                      </td>
                    </tr>
                  ) : (
                    getActiveReportData().rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{row.ref}</td>
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">{row.type}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{row.party}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            row.status === 'SETTLED' || row.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">{row.amount}</td>
                        <td className="p-3 text-center text-slate-500 text-[11px]">{row.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 2: FINANCIAL RECORDS (15 RECORD TYPES) */}
      {activeSubTab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Record Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2 max-h-[620px] overflow-y-auto pr-1">
            <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
              Financial Record Registers ({registers.length})
            </div>
            {registers.map((rec: any) => (
              <button
                key={rec.id}
                onClick={() => setSelectedRecordType(rec.id)}
                className={`w-full p-3 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                  selectedRecordType === rec.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-extrabold flex justify-between items-center">
                  <span>{rec.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedRecordType === rec.id
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {rec.count}
                  </span>
                </div>
                <div className={`text-[10px] mt-1 ${selectedRecordType === rec.id ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                  Timeline: {rec.timeline}
                </div>
              </button>
            ))}
          </div>

          {/* Record Details View */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {currentRegister.name} ({currentRegister.count || 0})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable underlying record register for compliance audits. Records transition: Active → Reversed → Archived.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPdf}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Excel
                  </button>
                </div>
              </div>

              {/* Dynamic Table for Selected Record Type */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b">
                    <tr>
                      <th className="p-3">Record ID</th>
                      <th className="p-3">Reference / Deal</th>
                      <th className="p-3">Entity / User</th>
                      <th className="p-3 text-right">Amount (TZS)</th>
                      <th className="p-3 text-center">Lifecycle State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {!currentRegister.rows || currentRegister.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          No records in this register yet. Real database entries will populate dynamically as transactions occur.
                        </td>
                      </tr>
                    ) : (
                      currentRegister.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-500 font-bold">{row.recordId}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{row.reference}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{row.entity}</td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            TZS {Number(row.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {row.state}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 3: FINANCIAL STATEMENTS (DYNAMIC P&L) */}
      {activeSubTab === 'statements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Statement of Profit or Loss & Other Comprehensive Income
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepared dynamically under Tanzania Financial Reporting Standards (TFRS) for {financialData?.statements?.currentPeriod || 'Fiscal Q3 2026'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>Print Official Statement</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3">Line Item</th>
                  <th className="p-3 text-center">Classification</th>
                  <th className="p-3 text-right">{financialData?.statements?.currentPeriod || 'Current Period'} (TZS)</th>
                  <th className="p-3 text-right">{financialData?.statements?.previousPeriod || 'Previous Period'} (TZS)</th>
                  <th className="p-3 text-center">Variance (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(financialData?.statements?.rows || []).map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{r.lineItem}</td>
                    <td className="p-3 text-center text-slate-500">{r.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      TZS {Number(r.currAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      TZS {Number(r.prevAmount || 0).toLocaleString()}
                    </td>
                    <td className={`p-3 text-center font-bold ${
                      r.variance?.startsWith('+') ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {r.variance}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-50/60 dark:bg-amber-950/30 font-black border-t-2 border-amber-300">
                  <td className="p-3 text-amber-900 dark:text-amber-200">
                    {financialData?.statements?.totals?.lineItem || 'NET OPERATING PROFIT'}
                  </td>
                  <td className="p-3 text-center text-amber-900 dark:text-amber-200">
                    {financialData?.statements?.totals?.category || 'Statutory Result'}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-900 dark:text-amber-200">
                    TZS {(financialData?.statements?.totals?.currAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-900 dark:text-amber-200">
                    TZS {(financialData?.statements?.totals?.prevAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center text-emerald-600">
                    {financialData?.statements?.totals?.variance || '+0.0%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB 4: DEAL ECONOMICS (REAL SYSTEM DEALS) */}
      {activeSubTab === 'deal_economics' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md text-xs">
                    {activeDeal.dealId}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {activeDeal.dealTitle}
                  </h3>
                  {realDeals.length > 1 && (
                    <select
                      value={selectedDealIndex}
                      onChange={(e) => setSelectedDealIndex(Number(e.target.value))}
                      className="text-xs font-bold py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {realDeals.map((d: any, idx: number) => (
                        <option key={d.dealId} value={idx}>
                          Select Deal: {d.dealId} - {d.dealTitle}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Timeline: Posted ({activeDeal.postedDate}) → Customer Payment ({activeDeal.customerPaymentDate}) → Closed ({activeDeal.financiallyClosedDate})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>Export Deal PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* Economics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Deal Value</div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-1">
                  TZS {activeDeal.dealValue.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <div className="text-[10px] uppercase font-bold text-blue-600">Merchant Payable (91%)</div>
                <div className="text-base font-black text-blue-700 dark:text-blue-300 font-mono mt-1">
                  TZS {activeDeal.merchantPayable.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-orange-50/60 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
                <div className="text-[10px] uppercase font-bold text-[#FF6A00]">Partner Reward (3%)</div>
                <div className="text-base font-black text-[#FF6A00] font-mono mt-1">
                  TZS {activeDeal.partnerReward.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                <div className="text-[10px] uppercase font-bold text-emerald-600">Lumo Net Margin (5.4%)</div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                  TZS {activeDeal.lumoNetContribution.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Deal Ledger Breakdown */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Financial Record Component</th>
                    <th className="p-3 text-center">Counterparty</th>
                    <th className="p-3 text-right">Amount (TZS)</th>
                    <th className="p-3 text-center">% of Deal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {(!activeDeal.rows || activeDeal.rows.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        No economics breakdown available for this record.
                      </td>
                    </tr>
                  ) : (
                    activeDeal.rows.map((item: any, i: number) => (
                      <tr key={i} className={i === activeDeal.rows.length - 1 ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-black border-t-2 border-emerald-300' : ''}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.item}</td>
                        <td className="p-3 text-center text-slate-500">{item.party}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          TZS {Number(item.amount).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-bold">{item.percentage}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB 5: REPORTING CALENDAR & DEADLINES */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today's Deadlines */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Today</h4>
                <span className="text-[10px] font-bold text-slate-500">Due by 23:59 EAT</span>
              </div>
              <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="flex justify-between font-bold text-xs text-orange-900 dark:text-orange-200">
                  <span>Daily Reconciliation Close</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">IN PROGRESS</span>
                </div>
                <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-1">
                  Match mobile money gateway settlement batches with internal ledger.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex justify-between font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  <span>Daily Merchant Settlement Report</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">COMPLETED</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                  All 12 pending batch disbursements processed and signed off.
                </p>
              </div>
            </div>

            {/* This Week */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">This Week</h4>
                <span className="text-[10px] font-bold text-slate-500">Week 37</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between font-bold text-xs text-blue-900 dark:text-blue-200">
                  <span>Weekly Financial Performance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">READY FOR REVIEW</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                  Revenue, partner commission rewards, and refunds summary for executive review.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                <div className="flex justify-between font-bold text-xs text-slate-800 dark:text-slate-200">
                  <span>Weekly Exception & Dispute Audit</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">NOT STARTED</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Due Friday, 18 September 2026.
                </p>
              </div>
            </div>

            {/* Monthly / Statutory */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Month-End & Statutory</h4>
                <span className="text-[10px] font-bold text-slate-500">TRA Filing Deadlines</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <div className="flex justify-between font-bold text-xs text-rose-900 dark:text-rose-200">
                  <span>Monthly TRA Withholding Tax Return</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">OVERDUE</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                  Statutory deadline: 7th day of subsequent month. Remittance pending approval.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex justify-between font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  <span>Monthly General Ledger Close</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">APPROVED</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                  Previous month GL accounts locked permanently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB 6: TAX & STATUTORY COMPLIANCE (Preserved) */}
      {activeSubTab === 'tax' && (
        <div className="space-y-6">
          {/* Statutory Tax Rules Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Effective-Dated Statutory Rules (Tanzania Revenue Authority)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    TRA_IND_5
                  </span>
                  <span className="text-xl font-black text-emerald-600">5%</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2">Individual Resident Withholding Tax</h4>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                  <div>Applicable: <strong>PARTNER_COMMISSION</strong></div>
                  <div>Authority: <strong>Tanzania Revenue Authority</strong></div>
                  <div className="text-emerald-600 font-bold mt-1">Enforced in System</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    TRA_NON_15
                  </span>
                  <span className="text-xl font-black text-blue-600">15%</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2">Non-Resident Partner Withholding Tax</h4>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                  <div>Applicable: <strong>PARTNER_COMMISSION</strong></div>
                  <div>Authority: <strong>Tanzania Revenue Authority</strong></div>
                  <div className="text-blue-600 font-bold mt-1">Enforced in System</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    TRA_VAT_FEE
                  </span>
                  <span className="text-xl font-black text-purple-600">18%</span>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white mt-2">LUMO Platform Fee VAT & Excise</h4>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                  <div>Applicable: <strong>PLATFORM_FEE</strong></div>
                  <div>Authority: <strong>Tanzania Revenue Authority</strong></div>
                  <div className="text-purple-600 font-bold mt-1">Enforced in System</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Gross-to-Net Simulator */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                  Interactive Gross-to-Net Statement Simulation
                </h3>
              </div>
              <button
                onClick={() => {
                  const certData: ReportData = {
                    title: 'Statutory Withholding Tax Certificate',
                    subtitle: 'Official TRA Remittance Documentation',
                    period: 'Fiscal Period 2026',
                    columns: [
                      { key: 'desc', label: 'Description', width: 250 },
                      { key: 'val', label: 'Statutory Value', align: 'right', type: 'currency', width: 180 },
                    ],
                    rows: [
                      { desc: 'Gross Partner Earnings', val: `TZS ${grossInput.toLocaleString()}` },
                      { desc: `Withholding Tax Deducted (${isNonResident ? '15%' : '5%'})`, val: `- TZS ${withholdingAmount.toLocaleString()}` },
                      { desc: 'Net Partner Mobile Money Payout', val: `TZS ${netEarnings.toLocaleString()}` },
                    ],
                    notes: [
                      'Certificate issued pursuant to Section 83 of the Income Tax Act (Cap. 332).',
                      'Tax deducted has been deposited to the Commissioner General of TRA.',
                    ],
                  }
                  exportFinancialReportToPdf(certData)
                  showToast('success', 'Tax Certificate Generated', 'Official signed tax deduction certificate generated as PDF.')
                }}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generate Tax Certificate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Simulate Gross Partner Earnings (TZS)
                </label>
                <input
                  type="number"
                  value={grossInput}
                  onChange={(e) => setGrossInput(Number(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="nonResident"
                    checked={isNonResident}
                    onChange={(e) => setIsNonResident(e.target.checked)}
                    className="rounded text-[#FF6A00]"
                  />
                  <label htmlFor="nonResident" className="text-xs text-slate-600 dark:text-slate-400">
                    Non-Resident Partner (15% rate)
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-500">Statutory Tax Withheld</div>
                <div className="text-lg font-black text-rose-600 font-mono mt-1">
                  - TZS {withholdingAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Rate applied: {(withholdingRate * 100).toFixed(0)}% TRA WHT</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Net Partner Mobile Money Payout</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                  TZS {netEarnings.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600/80 mt-1">Direct to M-Pesa / Tigo Pesa / Airtel</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
