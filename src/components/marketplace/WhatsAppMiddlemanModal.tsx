'use client'

import React, { useState } from 'react'
import {
  X,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  PackageCheck,
  Clock3,
  BadgeCheck,
} from 'lucide-react'
import type { OpportunityItem } from '@/modules/deals/types'

interface WhatsAppMiddlemanModalProps {
  deal: OpportunityItem | null
  isOpen: boolean
  onClose: () => void
  initialBuyerName?: string
  initialBuyerPhone?: string
}

export interface EscrowInquiry {
  id: string
  dealId: string
  dealTitle: string
  dealSlug: string
  sellerCompany: string
  sellerPhone: string
  sellerWhatsApp: string
  buyerName: string
  buyerPhone: string
  quantity: number
  deliveryLocation: string
  notes?: string
  escrowStatus: 'WAITING_ESCROW_PAYMENT' | 'FUNDS_HELD_IN_ESCROW' | 'DELIVERY_INSPECTION' | 'RELEASED_TO_SELLER'
  createdAt: string
  ticketCode: string
}

export function WhatsAppMiddlemanModal({
  deal,
  isOpen,
  onClose,
  initialBuyerName = '',
  initialBuyerPhone = '',
}: WhatsAppMiddlemanModalProps) {
  const [buyerName, setBuyerName] = useState(initialBuyerName)
  const [buyerPhone, setBuyerPhone] = useState(initialBuyerPhone)
  const [quantity, setQuantity] = useState(deal?.minOrderQuantity || 1)
  const [deliveryLocation, setDeliveryLocation] = useState(deal?.region || 'Dar es Salaam')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [escrowAccepted, setEscrowAccepted] = useState(true)
  const [generatedTicket, setGeneratedTicket] = useState<EscrowInquiry | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !deal) return null

  const handleGenerateConnection = (e: React.FormEvent) => {
    e.preventDefault()

    const ticketCode = `LUMO-ESCROW-${Date.now().toString().slice(-6)}`
    const inquiry: EscrowInquiry = {
      id: `inq_${Date.now()}`,
      dealId: deal.id,
      dealTitle: deal.title,
      dealSlug: deal.slug,
      sellerCompany: deal.companyName,
      sellerPhone: deal.sellerPhone || '+255 754 889 900',
      sellerWhatsApp: deal.sellerWhatsApp || '255754889900',
      buyerName: buyerName.trim() || 'Valued Partner',
      buyerPhone: buyerPhone.trim() || '+255 700 000 000',
      quantity: Number(quantity) || 1,
      deliveryLocation: deliveryLocation.trim() || deal.region,
      notes: buyerNotes.trim() || undefined,
      escrowStatus: 'FUNDS_HELD_IN_ESCROW',
      createdAt: new Date().toISOString(),
      ticketCode,
    }

    // Persist in localStorage for Merchant & Partner dashboards
    if (typeof window !== 'undefined') {
      try {
        const existing: EscrowInquiry[] = JSON.parse(
          localStorage.getItem('lumo_escrow_inquiries') || '[]'
        )
        localStorage.setItem('lumo_escrow_inquiries', JSON.stringify([inquiry, ...existing]))
        window.dispatchEvent(new Event('lumo:escrow-inquiries-updated'))
      } catch (err) {
        console.warn('Could not store escrow inquiry', err)
      }
    }

    setGeneratedTicket(inquiry)
  }

  // Pre-formatted message text for WhatsApp
  const cleanPhone = (deal.sellerWhatsApp || '255754889900').replace(/[^0-9]/g, '')
  const ticketId = generatedTicket?.ticketCode || `LUMO-ESCROW-${deal.id.slice(-4).toUpperCase()}`

  const messageText = `Habari ${deal.companyName}! I am connecting via LUMO Middleman Matchmaker.
Ref: ${ticketId}
Deal: ${deal.title}
Buyer Name: ${buyerName || 'Client'}
Buyer Phone: ${buyerPhone || 'Provided'}
Quantity Required: ${quantity} unit(s)
Delivery Destination: ${deliveryLocation}
Escrow Protection: Active (48-hour inspection window before funds release).
${buyerNotes ? `Notes: ${buyerNotes}` : ''}`

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-y-auto max-h-[calc(100dvh-2rem)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>LUMO Escrow Middleman Matchmaker</span>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug mb-1">
          WhatsApp Direct Deal Connection
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Lumo acts as the trusted escrow middleman. We connect buyer and merchant directly while protecting funds during the 48-hour inspection window.
        </p>

        {/* Deal Quick Summary Strip */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 mb-5 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                {deal.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <span>Offered by <strong>{deal.companyName}</strong></span>
                {deal.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              </p>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md shrink-0">
              {deal.principalPriceDisplay || 'Commercial Deal'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="flex items-center gap-1 font-semibold">
              <MapPin className="w-3 h-3 text-orange-500" /> {deal.region}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock3 className="w-3 h-3 text-emerald-600" /> 48h Escrow Inspection Hold
            </span>
            {deal.isGoldenVip && (
              <span className="font-extrabold text-amber-600">👑 Golden VIP Verified</span>
            )}
          </div>
        </div>

        {!generatedTicket ? (
          /* Step 1: Buyer Information Form */
          <form onSubmit={handleGenerateConnection} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name / Business Identity
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Alex Mushi (Apex Trading)"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="e.g. +255 712 345 678"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity / Scope Required
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="e.g. 5"
                  className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Delivery / Site Location
              </label>
              <input
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="e.g. Mikocheni B, Dar es Salaam"
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Specific Inquiries or Timelines (Optional)
              </label>
              <textarea
                rows={2}
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="e.g. Need physical sample inspection before releasing final balance."
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={escrowAccepted}
                  onChange={(e) => setEscrowAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600 rounded"
                />
                <span className="text-[11px] text-emerald-900 dark:text-emerald-300 font-medium">
                  <strong>Lumo Escrow Protection:</strong> Funds are held safely during a 48-hour delivery inspection window. Payment is only released to the merchant once genuine product quality is confirmed.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!escrowAccepted}
              className="w-full py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950" />
              <span>Generate WhatsApp Escrow Ticket & Connect</span>
            </button>
          </form>
        ) : (
          /* Step 2: Escrow Ticket Generated & Direct WhatsApp Launch */
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 text-center dark:border-emerald-700 dark:bg-emerald-950/30">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Escrow Matchmaker Ticket Ready
              </p>
              <p className="font-mono text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {generatedTicket.ticketCode}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Lumo has prepared the verified connection for <strong>{generatedTicket.sellerCompany}</strong>.
              </p>
            </div>

            {/* Escrow Terms summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Merchant Contact:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deal.sellerPhone || '+255 754 889 900'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Units Requested:</span>
                <span className="font-bold text-slate-900 dark:text-white">{generatedTicket.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Escrow Hold Period:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">48h Quality Inspection</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>Open WhatsApp Matchmaker Chat Now</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Pre-filled Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Done & Back to Deals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
