'use client'

import React from 'react'

export function AuthOpportunityBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 w-full h-full overflow-hidden z-0"
    >
      {/* Warm Ambient Radial & Soft Cream Gradient Wash */}
      <div className="absolute inset-0 bg-[#FDFBF7] dark:bg-[#0B1220] transition-colors" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-orange-500/8 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Background Line Art: Location Pin (Left), Dotted Trajectory, Wireframe Globe (Right) */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-40 dark:opacity-20 text-[#F97316]"
      >
        {/* 1. Bottom Left: Location Map Pin */}
        <g transform="translate(60, 680)" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 8 C22 8, 8 22, 8 40 C8 62, 40 95, 40 95 C40 95, 72 62, 72 40 C72 22, 58 8, 40 8 Z" fill="#FFF7ED" fillOpacity="0.2" />
          <circle cx="40" cy="38" r="10" stroke="#F97316" strokeWidth="1.2" />
        </g>

        {/* 2. Dotted Global Trade Path Connecting Left Pin to Central Canvas to Right Globe */}
        <path
          d="M100 775 C320 840, 540 760, 800 810 C1050 860, 1180 720, 1300 750"
          stroke="#F97316"
          strokeWidth="1.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />

        {/* Additional Graceful Trajectory Arc */}
        <path
          d="M0 620 C400 580, 800 880, 1440 680"
          stroke="#FDBA74"
          strokeWidth="1"
          strokeDasharray="4 8"
          strokeOpacity="0.6"
        />

        {/* 3. Bottom Right: Large Wireframe Globe */}
        <g transform="translate(1120, 620)" stroke="#F97316" strokeWidth="1.2" opacity="0.85">
          {/* Outer Circle */}
          <circle cx="150" cy="150" r="130" stroke="#F97316" strokeWidth="1.3" />
          
          {/* Latitude Ellipses */}
          <ellipse cx="150" cy="150" rx="130" ry="45" stroke="#F97316" strokeDasharray="3 4" strokeOpacity="0.8" />
          <ellipse cx="150" cy="150" rx="130" ry="85" stroke="#F97316" strokeOpacity="0.7" />
          <line x1="20" y1="150" x2="280" y2="150" stroke="#F97316" strokeWidth="1.2" />

          {/* Longitude Ellipses */}
          <ellipse cx="150" cy="150" rx="45" ry="130" stroke="#F97316" strokeDasharray="3 4" strokeOpacity="0.8" />
          <ellipse cx="150" cy="150" rx="85" ry="130" stroke="#F97316" strokeOpacity="0.7" />
          <line x1="150" y1="20" x2="150" y2="280" stroke="#F97316" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  )
}
