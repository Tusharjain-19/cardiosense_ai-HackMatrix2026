'use client'

import React, { useEffect, useState } from 'react'

interface CuteCardiacMascotProps {
  isEmailFocused: boolean
  isPasswordFocused: boolean
  showPassword: boolean
  isLoading: boolean
  hasAnyInput?: boolean
}

export default function CuteCardiacMascot({
  isEmailFocused,
  isPasswordFocused,
  showPassword,
  isLoading,
  hasAnyInput = false,
}: CuteCardiacMascotProps) {
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Cover eyes whenever user is writing / typing in any input, otherwise follow cursor
  const isCovering = isEmailFocused || isPasswordFocused

  const getPupilShift = () => {
    if (isCovering) return { dx: 0, dy: 0 }

    const avatarX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400
    const avatarY = 250
    const dx = mousePos.x - avatarX
    const dy = mousePos.y - avatarY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const maxRadius = 6

    return {
      dx: (dx / dist) * Math.min(dist / 20, maxRadius),
      dy: (dy / dist) * Math.min(dist / 20, maxRadius),
    }
  }

  const shift = getPupilShift()

  return (
    <div className="w-full flex justify-center -mb-8 z-30 relative pointer-events-none select-none">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 drop-shadow-xl transition-transform duration-300 hover:scale-105">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          {/* Stethoscope Band */}
          <path d="M 26 55 Q 60 100 94 55" stroke="#0F172A" strokeWidth="4.5" fill="none" />
          <circle cx="60" cy="85" r="7" fill="#F59E0B" stroke="#0F172A" strokeWidth="2.5" />

          {/* Heart Body */}
          <path
            d="M 60 98 C 22 72, 4 48, 12 28 C 18 10, 42 10, 60 26 C 78 10, 102 10, 108 28 C 116 48, 98 72, 60 98 Z"
            fill="#F43F5E"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          {/* Highlight */}
          <path d="M 28 26 C 35 18, 48 18, 54 26" stroke="#FDA4AF" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Glasses Frame */}
          <circle cx="44" cy="42" r="13" fill="none" stroke="#0F172A" strokeWidth="3" />
          <circle cx="76" cy="42" r="13" fill="none" stroke="#0F172A" strokeWidth="3" />
          <line x1="57" y1="42" x2="63" y2="42" stroke="#0F172A" strokeWidth="3" />

          {/* Eyes & Pupils */}
          {!isCovering ? (
            <g>
              <circle cx="44" cy="42" r="7" fill="#FFFFFF" />
              <circle cx={44 + shift.dx} cy={42 + shift.dy} r="4" fill="#0F172A" />
              <circle cx={45 + shift.dx * 0.8} cy={40 + shift.dy * 0.8} r="1.5" fill="#FFFFFF" />

              <circle cx="76" cy="42" r="7" fill="#FFFFFF" />
              <circle cx={76 + shift.dx} cy={42 + shift.dy} r="4" fill="#0F172A" />
              <circle cx={77 + shift.dx * 0.8} cy={40 + shift.dy * 0.8} r="1.5" fill="#FFFFFF" />
            </g>
          ) : (
            <g stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 38 43 Q 44 38 50 43" />
              <path d="M 70 43 Q 76 38 82 43" />
            </g>
          )}

          {/* Cute Smile */}
          <path
            d={
              isLoading
                ? 'M 50 62 Q 60 70 70 62'
                : isEmailFocused
                ? 'M 48 60 Q 60 72 72 60'
                : isPasswordFocused && showPassword
                ? 'M 48 64 Q 60 56 72 64'
                : 'M 52 60 Q 60 66 68 60'
            }
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cute Rosy Cheeks */}
          <circle cx="32" cy="52" r="5" fill="#FB7185" opacity="0.7" />
          <circle cx="88" cy="52" r="5" fill="#FB7185" opacity="0.7" />

          {/* Cute Paws - Moves UP over eyes when isCovering is true, and DOWN when false */}
          <g
            className="transition-transform duration-300 ease-out"
            style={{
              transform: isCovering ? 'translate(0px, -14px)' : 'translate(0px, 14px)',
            }}
          >
            {/* Left Paw */}
            <path d="M 22 66 Q 10 52 36 52" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="52" r="9" fill="#E11D48" stroke="#0F172A" strokeWidth="2.5" />

            {/* Right Paw */}
            <path d="M 98 66 Q 110 52 84 52" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="82" cy="52" r="9" fill="#E11D48" stroke="#0F172A" strokeWidth="2.5" />
          </g>
        </svg>
      </div>
    </div>
  )
}
