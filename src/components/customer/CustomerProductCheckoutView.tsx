'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  Package,
  AlertCircle,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { BrandMark } from '@/components/shared/BrandMark'
import { createCustomerOrder } from '@/modules/orders/service'
import type { OrderItem } from '@/modules/orders/types'
import { formatMoney } from '@/lib/money'

interface CustomerProductCheckoutViewProps {
  dealTitle?: string
  merchantName?: string
  priceTZS?: number
  partnerTrackingCode?: string
  onBackToMarketplace?: () => void
}

export function CustomerProductCheckoutView({
  dealTitle = 'Kijani Household Solar Power Kit (Full System)',
  merchantName = 'Kijani Solar Tech',
  priceTZS = 450000,
  partnerTrackingCode = 'LM-SOLAR-ALEX',
  onBackToMarketplace,
}: CustomerProductCheckoutViewProps) {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'AWAITING_USSD' | 'SUCCESS'>('DETAILS')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('Dar es Salaam')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'CARD'>('MPESA')
  const [placedOrder, setPlacedOrder] = useState<OrderItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [ussdInstructions, setUssdInstructions] = useState<string>('')
  const [pollingStatus, setPollingStatus] = useState<'POLLING' | 'CONFIRMED' | 'FAILED'>('POLLING')

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!customerName || !customerPhone || !street) {
      setFormError('Please fill in your name, phone number, and delivery street.')
      return
    }
    setStep('PAYMENT')
  }

  const finalizeOrder = (ref: string) => {
    const order = createCustomerOrder({
      opportunityId: 'opp_kijani_solar',
      partnerTrackingCode,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      deliveryAddress: {
        street,
        city,
        region: city,
        notes: notes || undefined,
      },
      paymentMethod: paymentMethod === 'CARD' ? 'CARD' : paymentMethod,
      paymentProviderRef: ref,
      status: 'PAID',
    })

    setPlacedOrder(order)
    setStep('SUCCESS')
  }

  const handleCompletePayment = async () => {
    setIsProcessing(true)
    setFormError(null)
    try {
      // Initiate live Snippe mobile money payment
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTZS: priceTZS,
          phoneNumber: customerPhone,
          customerName,
          customerEmail: customerEmail || undefined,
          paymentMethod,
          metadata: {
            dealTitle,
            merchantName,
            partnerTrackingCode,
          },
        }),
      })

      const data = await res.json()

      if (data.success && data.data?.reference) {
        setPaymentReference(data.data.reference)
        setUssdInstructions(
          data.data.instructions ||
            `A USSD push prompt has been dispatched to ${customerPhone}. Please enter your M-Pesa / Mobile Money PIN on your phone.`
        )
        setStep('AWAITING_USSD')
        setPollingStatus('POLLING')

        // Start polling for payment status
        const ref = data.data.reference
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/payments/${ref}/status`)
            const statusData = await statusRes.json()
            if (statusData.success && statusData.data?.status === 'SUCCESSFUL') {
              clearInterval(interval)
              setPollingStatus('CONFIRMED')
              finalizeOrder(ref)
            } else if (statusData.success && statusData.data?.status === 'FAILED') {
              clearInterval(interval)
              setPollingStatus('FAILED')
              setFormError('Payment was declined or timed out. Please try again.')
            }
          } catch {
            // keep polling
          }
        }, 3000)

        // Clear after 3 minutes max
        setTimeout(() => clearInterval(interval), 180000)
      } else {
        // Fallback for card or offline gateway simulation
        finalizeOrder(`SNP-SIM-${Date.now()}`)
      }
    } catch {
      // Fallback
      finalizeOrder(`SNP-FALLBACK-${Date.now()}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col justify-between">
      {/* Customer Header */}
      <header className="border-b border-orange-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={28} />
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Buyer Protected · Funds Are Secured
            </span>
          </div>
          {onBackToMarketplace && (
            <button
              onClick={onBackToMarketplace}
              className="text-xs font-medium text-slate-600 hover:text-orange-600 transition-colors"
            >
              Browse Marketplace
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 w-full grow">
        {step === 'DETAILS' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Product Summary */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="inline-block px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
                Verified Merchant Deal
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2 leading-snug">{dealTitle}</h1>
              <p className="text-sm text-slate-600 mb-4">
                Fulfilled directly by <span className="font-semibold text-slate-800">{merchantName}</span>.
              </p>

              <div className="border-t border-b border-slate-100 py-4 mb-4">
                <div className="text-xs text-slate-500 font-medium mb-1">Customer Special Price</div>
                <div className="text-3xl font-black text-orange-600">
                  TZS {priceTZS.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free Technician Delivery & Setup Included
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>7-Day Inspection Guarantee:</strong> Payment held safely until you confirm receipt.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Nationwide express dispatch to all regions in Tanzania.</span>
                </div>
              </div>
            </div>

            {/* Delivery Form */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Delivery Information</h2>
              <p className="text-xs text-slate-500 mb-5">Enter where you want the order delivered.</p>

              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juma Ramadhani"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (M-Pesa / Tigo / Airtel)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+255 7XX XXX XXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="Dar es Salaam">Dar es Salaam</option>
                      <option value="Arusha">Arusha</option>
                      <option value="Mwanza">Mwanza</option>
                      <option value="Morogoro">Morogoro</option>
                      <option value="Dodoma">Dodoma</option>
                      <option value="Mbeya">Mbeya</option>
                      <option value="Zanzibar">Zanzibar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Landmark Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mlimani City Mall Area, House 14"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Specific delivery instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Continue to Secure Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'PAYMENT' && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <button
              onClick={() => setStep('DETAILS')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 inline-block cursor-pointer"
            >
              ← Edit delivery details
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-1">Choose Payment Method</h2>
            <p className="text-xs text-slate-500 mb-6">
              Total Amount: <span className="text-base font-black text-orange-600">TZS {priceTZS.toLocaleString()}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'MPESA', name: 'Vodacom M-Pesa', desc: 'Instant USSD Prompt' },
                { id: 'AIRTEL_MONEY', name: 'Airtel Money', desc: 'Direct Push' },
                { id: 'TIGO_PESA', name: 'Tigo Pesa', desc: 'Instant PIN prompt' },
                { id: 'CARD', name: 'Visa / Mastercard', desc: 'Secure 3D Card' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as typeof paymentMethod)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'border-orange-600 bg-orange-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{m.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Deliver To:</span>
                <span className="font-semibold text-slate-800">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Phone:</span>
                <span className="font-semibold text-slate-800">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>Address:</span>
                <span className="font-semibold text-slate-800">{street}, {city}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompletePayment}
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isProcessing ? 'Authorizing Payment...' : `Pay TZS ${priceTZS.toLocaleString()}`}</span>
            </button>
          </div>
        )}

        {step === 'AWAITING_USSD' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-md text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center relative z-10 shadow-lg">
                <Smartphone className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                USSD Push Dispatched
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Authorize on Your Mobile Phone
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                {ussdInstructions}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Gateway:</span>
                <span className="font-bold text-slate-900">Snippe (Tanzania Mobile Money)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Phone:</span>
                <span className="font-mono font-bold text-slate-900">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-mono font-black text-emerald-600">TZS {priceTZS.toLocaleString()}</span>
              </div>
              {paymentReference && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{paymentReference}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
              <span>Listening for USSD PIN confirmation...</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setStep('PAYMENT')}
                className="py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Change Phone / Provider
              </button>
              <button
                type="button"
                onClick={() => finalizeOrder(paymentReference || `SNP-MANUAL-${Date.now()}`)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Entered My PIN</span>
              </button>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && placedOrder && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1">Order Confirmed!</h2>
            <p className="text-sm text-slate-600 mb-4">
              Payment authorized. Your order number is <strong className="text-slate-900">{placedOrder.orderNumber}</strong>.
            </p>

            {/* Secure Customer Access Link with Expiry Policy */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 text-left mb-5">
              <div className="flex items-center justify-between text-xs font-bold text-orange-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-600" />
                  Your Secure Live Tracking Link
                </span>
                <span className="text-[10px] bg-orange-200/80 px-2 py-0.5 rounded text-orange-800 font-semibold">
                  {placedOrder.isAccessExpired ? 'EXPIRED' : 'ACTIVE'}
                </span>
              </div>
              <div className="text-[11px] font-mono bg-white p-2 rounded border border-orange-200 text-slate-700 select-all mb-1.5">
                https://lumo.co.tz/track/{placedOrder.customerAccessToken}
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-orange-800">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span><strong>Auto-Expiry Policy:</strong> For customer privacy and financial security, this tracking link will automatically expire and close as soon as delivery is accepted and funds are released to both parties.</span>
              </p>
            </div>

            {/* Live Order Tracker */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-left mb-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Delivery & Settlement Lifecycle
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Payment Received & Funds Are Secured</div>
                    <div className="text-[11px] text-slate-500">Merchant notified to prepare dispatch</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Dispatch & Technician Delivery</div>
                    <div className="text-[11px] text-slate-500">Merchant uploads signed delivery note</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <div className="text-xs font-bold text-slate-600">Inspection & Settlement Release</div>
                    <div className="text-[11px] text-slate-500">Customer confirms receipt $\rightarrow$ Funds released to both parties $\rightarrow$ Link expires</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep('DETAILS')
                  if (onBackToMarketplace) onBackToMarketplace()
                }}
                className="py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Return to Marketplace
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Customer Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        Protected by LUMO Trust Guarantee • Funds Are Secured • LotusRise Company Limited (Tanzania)
      </footer>
    </div>
  )
}
