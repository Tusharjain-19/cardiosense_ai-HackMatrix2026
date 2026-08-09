'use client'

import React from 'react'

interface CardiosenseLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  showText?: boolean
}

export default function CardiosenseLogo({
  size = 'md',
  variant = 'light',
  showText = true,
}: CardiosenseLogoProps) {
  // Dimensions map
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 44 : 34
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'

  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-900'
  const subTextColor = variant === 'dark' ? 'text-teal-400' : 'text-teal-700'

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Emblem: Heart + ECG Rhythm Pulse */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm transition-transform group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Medical Seal Shield / Circle */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill={variant === 'dark' ? '#0F172A' : '#F0FDFA'}
            stroke={variant === 'dark' ? '#1E293B' : '#CCFBF1'}
            strokeWidth="4"
          />

          {/* Stylized Human Heart Outline */}
          <path
            d="M 50 82 C 22 62, 14 42, 25 28 C 34 16, 46 22, 50 30 C 54 22, 66 16, 75 28 C 86 42, 78 62, 50 82 Z"
            fill="none"
            stroke="#0D9488"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Clinical ECG Waveform Pulse Line passing through Heart */}
          <path
            d="M 12 50 L 32 50 L 37 42 L 43 62 L 49 20 L 56 75 L 62 45 L 67 52 L 88 50"
            fill="none"
            stroke="#E11D48"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sensing Precision Dot */}
          <circle cx="49" cy="20" r="3.5" fill="#E11D48" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight ${textSize} ${textColor}`}>
            Cardiosense <span className={subTextColor}>AI</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-slate-600 uppercase mt-0.5">
            Cardiac Analytics
          </span>
        </div>
      )}
    </div>
  )
}
