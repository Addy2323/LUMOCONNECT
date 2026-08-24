'use client'

import React from 'react'
import { AuthOpportunityBackground } from './AuthOpportunityBackground'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between overflow-x-hidden">
      {/* Background Subtle Opportunity Illustration Layer (Full width behind content) */}
      <AuthOpportunityBackground />

      {/* Foreground Content Layer (Cards, Forms, Inputs) */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center pb-24 sm:pb-28">
        {children}
      </div>
    </div>
  )
}
