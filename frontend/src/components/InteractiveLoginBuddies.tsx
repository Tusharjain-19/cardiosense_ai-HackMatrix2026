'use client'

import React, { useEffect, useState } from 'react'

interface InteractiveLoginBuddiesProps {
  isEmailFocused: boolean
  isPasswordFocused: boolean
  showPassword: boolean
  isLoading: boolean
  hasAnyInput?: boolean
}

export default function InteractiveLoginBuddies({
  isEmailFocused,
  isPasswordFocused,
  showPassword,
  isLoading,
  hasAnyInput = false,
}: InteractiveLoginBuddiesProps) {
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 })
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 })

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Cover eyes whenever user is writing / typing in any input, otherwise follow cursor
  const isCovering = isEmailFocused || isPasswordFocused

  // Calculate pupil offset relative to screen position
  const getPupilOffset = (baseX: number, baseY: number, maxRadius = 8) => {
    if (isCovering) {
      return { dx: 0, dy: 0 }
    }
    const dx = mousePos.x - baseX
    const dy = mousePos.y - baseY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    const shiftX = (dx / dist) * Math.min(dist / 25, maxRadius)
    const shiftY = (dy / dist) * Math.min(dist / 25, maxRadius)

    return { dx: shiftX, dy: shiftY }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. GIANT PINK CARDIAC MONSTER - PEEKING FROM TOP-LEFT CORNER */}
      <div
        className="absolute -top-16 -left-16 w-80 h-96 transition-transform duration-500 ease-out z-10"
        style={{
          transform: isCovering ? 'translate(-10px, -10px) rotate(-4deg)' : 'translate(0px, 0px) rotate(0deg)',
        }}
      >
        <svg viewBox="0 0 250 300" className="w-full h-full drop-shadow-2xl">
          {/* Giant Pink Blob Body */}
          <path
            d="M -30 -30 L 220 -30 C 240 60, 210 160, 160 210 C 110 260, -10 240, -30 180 Z"
            fill="#F472B6"
          />
          {/* Pulse Highlight Wave */}
          <path
            d="M -10 40 Q 60 10 130 60 T 200 40"
            stroke="#FBCFE8"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* Big Googly Eye 1 */}
          <circle cx="110" cy="110" r="32" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          {!isCovering ? (
            <>
              <circle
                cx={110 + getPupilOffset(200, 150, 14).dx}
                cy={110 + getPupilOffset(200, 150, 14).dy}
                r="14"
                fill="#0F172A"
              />
              <circle
                cx={114 + getPupilOffset(200, 150, 14).dx * 0.8}
                cy={104 + getPupilOffset(200, 150, 14).dy * 0.8}
                r="5"
                fill="#FFFFFF"
              />
            </>
          ) : (
            <path d="M 90 115 Q 110 100 130 115" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" fill="none" />
          )}

          {/* Eye 2 (Smaller) */}
          <circle cx="170" cy="80" r="20" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          {!isCovering ? (
            <>
              <circle
                cx={170 + getPupilOffset(300, 100, 9).dx}
                cy={80 + getPupilOffset(300, 100, 9).dy}
                r="9"
                fill="#0F172A"
              />
              <circle
                cx={173 + getPupilOffset(300, 100, 9).dx * 0.8}
                cy={76 + getPupilOffset(300, 100, 9).dy * 0.8}
                r="3"
                fill="#FFFFFF"
              />
            </>
          ) : (
            <path d="M 158 83 Q 170 72 182 83" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
          )}

          {/* Surprised Mouth */}
          <ellipse cx="140" cy="165" rx="14" ry="18" fill="#831843" stroke="#0F172A" strokeWidth="3" />
          <path d="M 132 154 Q 140 162 148 154" fill="#FFFFFF" />

          {/* HANDS PLACED DIRECTLY OVER EYES (WHEN ISCOVERING IS TRUE) */}
          <g
            className="transition-transform duration-500 ease-out"
            style={{
              transform: isCovering ? 'translate(0px, 0px)' : 'translate(-80px, 80px)',
              opacity: isCovering ? 1 : 0,
            }}
          >
            {/* Left Stretchy Hand Covering Eye 1 */}
            <path d="M 30 200 Q 80 180 110 110" stroke="#EC4899" strokeWidth="26" strokeLinecap="round" fill="none" />
            <circle cx="110" cy="110" r="34" fill="#F472B6" stroke="#0F172A" strokeWidth="4" />

            {/* Right Stretchy Hand Covering Eye 2 */}
            <path d="M 30 220 Q 120 180 170 80" stroke="#EC4899" strokeWidth="22" strokeLinecap="round" fill="none" />
            <circle cx="170" cy="80" r="22" fill="#F472B6" stroke="#0F172A" strokeWidth="4" />
          </g>
        </svg>
      </div>

      {/* 2. GIANT YELLOW STETHOSCOPE MONSTER - PEEKING FROM BOTTOM-RIGHT CORNER */}
      <div
        className="absolute -bottom-20 -right-20 w-80 h-96 transition-transform duration-500 ease-out z-10"
        style={{
          transform: isCovering ? 'translate(10px, 10px) rotate(4deg)' : 'translate(0px, 0px) rotate(0deg)',
        }}
      >
        <svg viewBox="0 0 250 300" className="w-full h-full drop-shadow-2xl">
          {/* Giant Yellow Body */}
          <path
            d="M 300 350 L 80 350 C 40 280, 50 180, 100 120 C 150 60, 240 80, 300 120 Z"
            fill="#FACC15"
          />

          {/* Huge Googly Eye */}
          <circle cx="140" cy="160" r="36" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" />
          {!isCovering ? (
            <>
              <circle
                cx={140 + getPupilOffset(windowSize.width - 200, windowSize.height - 200, 16).dx}
                cy={160 + getPupilOffset(windowSize.width - 200, windowSize.height - 200, 16).dy}
                r="16"
                fill="#0F172A"
              />
              <circle
                cx={145 + getPupilOffset(windowSize.width - 200, windowSize.height - 200, 16).dx * 0.8}
                cy={152 + getPupilOffset(windowSize.width - 200, windowSize.height - 200, 16).dy * 0.8}
                r="6"
                fill="#FFFFFF"
              />
            </>
          ) : (
            <path d="M 115 165 Q 140 145 165 165" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" fill="none" />
          )}

          {/* Cute Mouth */}
          <ellipse cx="175" cy="220" rx="16" ry="20" fill="#78350F" stroke="#0F172A" strokeWidth="3" />
          <circle cx="178" cy="228" r="8" fill="#F87171" />

          {/* HAND PLACED DIRECTLY OVER EYE */}
          <g
            className="transition-transform duration-500 ease-out"
            style={{
              transform: isCovering ? 'translate(0px, 0px)' : 'translate(60px, 60px)',
              opacity: isCovering ? 1 : 0,
            }}
          >
            <path d="M 220 280 Q 170 230 140 160" stroke="#EAB308" strokeWidth="26" strokeLinecap="round" fill="none" />
            <circle cx="140" cy="160" r="38" fill="#FACC15" stroke="#0F172A" strokeWidth="4" />
          </g>
        </svg>
      </div>
    </div>
  )
}
