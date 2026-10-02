import React from 'react'
import Link from 'next/link'
import { Compass, Home, Globe, ArrowLeft, Search, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: '404 - Page Not Found | LUMO Marketplace',
  description: 'The page or deal you are looking for could not be found on LUMO.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#FF6A00] selection:text-white">
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF6A00]/20 via-cyan-500/10 to-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Animated Badge & Glowing 404 Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl text-xs font-bold font-mono tracking-wider text-[#FF6A00]">
            <ShieldAlert className="w-4 h-4 text-[#FF6A00] animate-pulse" />
            <span>404 — ROUTE UNCHARTED</span>
          </div>

          <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-[#FF6A00] to-cyan-400 font-mono drop-shadow-2xl">
            404
          </h1>

          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Lost in the Commercial Grid?
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
            The deal, page, or commercial opportunity you are looking for has been moved, renamed, or no longer exists on LUMO.
          </p>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
          <Link
            href="/"
            className="group p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-[#FF6A00]/50 rounded-2xl transition-all duration-300 shadow-xl flex items-start gap-4 hover:-translate-y-0.5"
          >
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF6A00] group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF6A00] transition-colors">
                LUMO Main Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Return to the home dashboard and earnings ticker.
              </p>
            </div>
          </Link>

          <Link
            href="/international"
            className="group p-5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-300 shadow-xl flex items-start gap-4 hover:-translate-y-0.5"
          >
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                International Marketplace
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore cross-border deals and commercial opportunities.
              </p>
            </div>
          </Link>
        </div>

        {/* Bottom Back Button & Brand Tag */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Previous Page</span>
          </Link>

          <div className="font-mono text-[11px] text-slate-600">
            LUMO Commercial Infrastructure &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}
