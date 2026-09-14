'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, Plus, Globe } from 'lucide-react'

export interface ChannelItem {
  id: string
  name: string
  placeholder: string
  iconColor: string
  bgLight: string
  borderActive: string
  renderIcon: (props: { className?: string }) => React.JSX.Element
}

export const AVAILABLE_CHANNELS: ChannelItem[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    placeholder: '+255 7XX XXX XXX (Group/Contacts)',
    iconColor: '#25D366',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    borderActive: 'border-emerald-500 ring-emerald-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.82 14.16c-.24.68-1.4 1.25-1.92 1.33-.51.08-1.16.11-3.69-.94-2.97-1.23-4.88-4.27-5.03-4.47-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.17 1.03-2.46.27-.29.59-.36.79-.36.2 0 .4 0 .57.01.19.01.44-.07.69.53.25.6.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.37 2.48 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.83.86 2.14 1.02.31.16.52.24.59.37.07.13.07.76-.17 1.44z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    placeholder: '@handle (e.g. @alexmushi, 20k followers)',
    iconColor: '#E1306C',
    bgLight: 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400',
    borderActive: 'border-pink-500 ring-pink-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    placeholder: '@handle (e.g. @dealseastafrica)',
    iconColor: '#000000',
    bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
    borderActive: 'border-slate-800 dark:border-slate-400 ring-slate-400/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 00-1-.08A6.34 6.34 0 003 15.66a6.34 6.34 0 0010.86 4.45V11.8a8.28 8.28 0 005.73 2.29V10.6a4.85 4.85 0 01-3.77-1.41V6.69z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    placeholder: 'youtube.com/@channel or Channel Name',
    iconColor: '#FF0000',
    bgLight: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400',
    borderActive: 'border-red-500 ring-red-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter)',
    placeholder: '@handle',
    iconColor: '#0F172A',
    bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
    borderActive: 'border-slate-800 dark:border-slate-400 ring-slate-400/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'Page name or profile link',
    iconColor: '#1877F2',
    bgLight: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    borderActive: 'border-blue-500 ring-blue-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'linkedin.com/in/username',
    iconColor: '#0A66C2',
    bgLight: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400',
    borderActive: 'border-sky-500 ring-sky-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.5a1.64 1.64 0 0 0-1.64 1.64c0 .91.73 1.64 1.64 1.64a1.64 1.64 0 0 0 1.64-1.64c0-.9-.73-1.64-1.64-1.64z" />
      </svg>
    ),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    placeholder: '@username or t.me/channel',
    iconColor: '#229ED9',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400',
    borderActive: 'border-cyan-500 ring-cyan-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    id: 'website',
    name: 'Website',
    placeholder: 'https://yourwebsite.co.tz',
    iconColor: '#4F46E5',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400',
    borderActive: 'border-indigo-500 ring-indigo-500/20',
    renderIcon: ({ className = 'w-4 h-4' }) => (
      <Globe className={className} />
    ),
  },
]

interface SocialChannelPickerProps {
  value: string
  onChange: (value: string) => void
}

export function SocialChannelPicker({ value, onChange }: SocialChannelPickerProps) {
  // Parse initial string if it contains channel data
  const [selectedChannels, setSelectedChannels] = useState<string[]>(() => {
    if (!value) return ['whatsapp', 'instagram']
    const found: string[] = []
    for (const ch of AVAILABLE_CHANNELS) {
      if (new RegExp(ch.name, 'i').test(value) || new RegExp(ch.id, 'i').test(value)) {
        found.push(ch.id)
      }
    }
    return found.length > 0 ? found : ['whatsapp', 'instagram']
  })

  const [channelValues, setChannelValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    if (!value) return initial

    // Try parsing e.g. "Instagram: @alex | WhatsApp: 2557..."
    const parts = value.split('|')
    for (const part of parts) {
      const colonIdx = part.indexOf(':')
      if (colonIdx !== -1) {
        const key = part.slice(0, colonIdx).trim().toLowerCase()
        const val = part.slice(colonIdx + 1).trim()
        const matched = AVAILABLE_CHANNELS.find(
          (c) => c.name.toLowerCase() === key || c.id === key
        )
        if (matched) {
          initial[matched.id] = val
        }
      }
    }
    return initial
  })

  // Sync back to combined string whenever selected channels or values change
  const syncToParent = (selected: string[], values: Record<string, string>) => {
    const combinedParts: string[] = []
    for (const chId of selected) {
      const config = AVAILABLE_CHANNELS.find((c) => c.id === chId)
      if (config) {
        const val = values[chId]?.trim()
        if (val) {
          combinedParts.push(`${config.name}: ${val}`)
        } else {
          combinedParts.push(`${config.name}`)
        }
      }
    }
    onChange(combinedParts.join(' | '))
  }

  const toggleChannel = (channelId: string) => {
    let next: string[]
    if (selectedChannels.includes(channelId)) {
      next = selectedChannels.filter((id) => id !== channelId)
    } else {
      next = [...selectedChannels, channelId]
    }
    setSelectedChannels(next)
    syncToParent(next, channelValues)
  }

  const handleValueChange = (channelId: string, val: string) => {
    const nextValues = { ...channelValues, [channelId]: val }
    setChannelValues(nextValues)
    syncToParent(selectedChannels, nextValues)
  }

  const removeChannel = (channelId: string) => {
    const next = selectedChannels.filter((id) => id !== channelId)
    setSelectedChannels(next)
    const nextValues = { ...channelValues }
    delete nextValues[channelId]
    setChannelValues(nextValues)
    syncToParent(next, nextValues)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-300">
          Social & Business Channels
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Select icons & fill your handles
        </span>
      </div>

      {/* Selectable Icon Chips Row */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {AVAILABLE_CHANNELS.map((channel) => {
          const isSelected = selectedChannels.includes(channel.id)
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => toggleChannel(channel.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all select-none border ${
                isSelected
                  ? `border-[#FF6A00] bg-orange-50/80 dark:bg-orange-950/30 text-[#0F172A] dark:text-white shadow-2xs scale-102`
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900'
              }`}
            >
              <span
                className="w-4 h-4 flex items-center justify-center shrink-0"
                style={{ color: isSelected ? channel.iconColor : undefined }}
              >
                {channel.renderIcon({ className: 'w-3.5 h-3.5' })}
              </span>
              <span>{channel.name}</span>
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-[#FF6A00] ml-0.5 shrink-0" />
              ) : (
                <Plus className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Dynamic Input Fields for Selected Channels */}
      {selectedChannels.length > 0 ? (
        <div className="space-y-2 pt-1">
          {selectedChannels.map((channelId) => {
            const config = AVAILABLE_CHANNELS.find((c) => c.id === channelId)
            if (!config) return null
            const curVal = channelValues[channelId] || ''

            return (
              <div
                key={channelId}
                className="relative flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F0F5FA] dark:bg-slate-800/60 focus-within:border-[#FF6A00] focus-within:ring-2 focus-within:ring-[#FF6A00]/20 transition-all overflow-hidden"
              >
                {/* Platform Badge with Icon */}
                <div className="flex items-center gap-1.5 pl-3 pr-2 py-2 shrink-0 border-r border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-900/40">
                  <span style={{ color: config.iconColor }}>
                    {config.renderIcon({ className: 'w-4 h-4' })}
                  </span>
                  <span className="hidden min-[400px]:inline text-[11px]">{config.name}</span>
                </div>

                {/* Input for this specific channel */}
                <input
                  type="text"
                  value={curVal}
                  onChange={(e) => handleValueChange(channelId, e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full py-2.5 px-3 text-xs sm:text-sm bg-transparent border-0 text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-none"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeChannel(channelId)}
                  title={`Remove ${config.name}`}
                  className="p-2 mr-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Chagua angalau mtandao mmoja hapo juu (mfano WhatsApp, Instagram) ili kujaza maelezo yako.
        </div>
      )}
    </div>
  )
}
