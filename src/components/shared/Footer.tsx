'use client'

import React from 'react'
import { ShieldCheck, Heart, Globe, Lock } from 'lucide-react'
import { BrandMark } from './BrandMark'

export function Footer({ onNavigate, variant = 'default' }: { onNavigate?: (view: string) => void; variant?: 'default' | 'landing' }) {
  if (variant === 'landing') return (
    <footer className="bg-[#030e1f] pb-24 pt-10 text-[#8ea2b8] md:pb-8">
      <div className="mx-auto w-[92%] max-w-[1200px]">
        <div className="grid grid-cols-2 gap-8 pb-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-extrabold tracking-wider text-white">LUMO</span>
                <span className="text-[11px] text-white/80 font-medium">Deals & Opportunities</span>
              </div>
            </div>
            <p className="mt-3.5 max-w-[270px] text-xs leading-relaxed text-[#7e95b0]">
              Connecting people, projects and possibilities across Tanzania.
            </p>
          </div>

          {/* Col 2: Support */}
          <div>
            <h3 className="mb-3.5 text-xs font-bold text-white">Support</h3>
            <ul className="space-y-2.5 text-xs text-[#8ea2b8]">
              <li>
                <button onClick={() => onNavigate?.('partner')} className="hover:text-white transition-colors">
                  Help Centre
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('choose_path')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('subscriptions')} className="hover:text-white transition-colors">
                  Partner Guidelines
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h3 className="mb-3.5 text-xs font-bold text-white">Legal</h3>
            <ul className="space-y-2.5 text-xs text-[#8ea2b8]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Cookie Policy</span></li>
            </ul>
          </div>

          {/* Col 4: Follow Us */}
          <div>
            <h3 className="mb-3.5 text-xs font-bold text-white">Follow Us</h3>
            <div className="flex items-center gap-3 text-white">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="text-white hover:text-[#ff6500] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-white hover:text-[#ff6500] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="text-white hover:text-[#ff6500] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.75 2 12 2 12s0 3.25.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15.5V8.5l6 3.5-6 3.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#142338] pt-5 text-[11px] text-[#64748b]">
          <p>© 2024 LUMO. All rights reserved.</p>
          <p>Illustrative deals. Membership does not guarantee earnings.</p>
        </div>
      </div>
    </footer>
  )
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
