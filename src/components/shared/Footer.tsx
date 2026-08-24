'use client'

import React from 'react'
import { ShieldCheck, Heart, Globe, Lock } from 'lucide-react'
import { BrandMark } from './BrandMark'

export function Footer({ onNavigate }: { onNavigate?: (view: string) => void }) {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-12 pb-24 md:pb-12 text-xs">
      <div className="lumo-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <BrandMark size={24} />
              <span className="font-extrabold text-base tracking-widest text-white">
                LUMO
              </span>
            </div>
            <p className="text-slate-300 font-semibold text-sm">
              Discover. Connect. Perform. Earn.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              LUMO is a Performance Commerce and Opportunity Marketplace owned by{' '}
              <strong className="text-white">LotusRise Company Limited</strong>. Operating in Tanzania and expanding across East Africa and the continent.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Money follows genuine and independently verifiable economic activity.</span>
            </div>
          </div>

          {/* Column 2: Marketplace */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Discover Deals</button></li>
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Customer Acquisition</button></li>
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Qualified Leads</button></li>
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Content & Influence</button></li>
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Distributor Search</button></li>
              <li><button onClick={() => onNavigate?.('marketplace')} className="hover:text-white">Reverse-Sourcing Bounties</button></li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Portals & Tools
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate?.('partner')} className="hover:text-white">Partner Portal</button></li>
              <li><button onClick={() => onNavigate?.('business')} className="hover:text-white">Business Hub</button></li>
              <li><button onClick={() => onNavigate?.('dealroom')} className="hover:text-white">B2B Deal Room</button></li>
              <li><button onClick={() => onNavigate?.('admin')} className="hover:text-white">Maker-Checker Operations</button></li>
              <li><button onClick={() => onNavigate?.('onboarding')} className="hover:text-white">Partner Registration</button></li>
            </ul>
          </div>

          {/* Column 4: Compliance & Trust */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2">
              <li><span className="text-slate-400">TRA Tax Compliance (5%)</span></li>
              <li><span className="text-slate-400">Mongike Mobile Money Integration</span></li>
              <li><span className="text-slate-400">Terms of Service</span></li>
              <li><span className="text-slate-400">Privacy & Data Protection</span></li>
              <li><span className="text-slate-400">Anti-Fraud & Risk Policy</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} LotusRise Company Limited. All rights reserved. Registered in the United Republic of Tanzania.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Tanzania (TZS) · East Africa
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Idempotent & Auditable
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
