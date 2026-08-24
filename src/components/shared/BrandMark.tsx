import React from 'react'

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="relative grid grid-cols-2 gap-1 place-items-center"
      style={{ width: size, height: size, transform: 'rotate(45deg)' }}
      aria-hidden="true"
    >
      <span className="w-full h-full bg-[#F97316] rounded-tl-lg rounded-tr-xs rounded-bl-xs rounded-br-xs shadow-sm" />
      <span className="w-full h-full bg-[#F97316] rounded-tr-lg rounded-tl-xs rounded-bl-xs rounded-br-xs opacity-90" />
      <span className="w-full h-full bg-[#F97316] rounded-bl-lg rounded-tl-xs rounded-tr-xs rounded-br-xs opacity-80" />
      <span className="w-full h-full bg-[#111827] dark:bg-white rounded-br-lg rounded-tl-xs rounded-tr-xs rounded-bl-xs" />
    </div>
  )
}
