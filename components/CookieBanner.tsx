'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1A1A1A]/10 bg-[#EAD5C4] shadow-lg">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between px-6 py-4">
        <p className="text-sm text-[#1A1A1A]/70 flex-1">
          Използваме само функционални бисквитки, необходими за работата на платформата. Вижте нашата{' '}
          <Link href="/legal/privacy" className="font-semibold text-[#1A1A1A] underline underline-offset-2 hover:text-[#C9A84C] transition-colors">
            политика за поверителност
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A]/40 transition-colors"
          >
            Откажи
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#1A1A1A] text-[#EAD5C4] hover:bg-[#C9A84C] transition-colors"
          >
            Приемам
          </button>
        </div>
      </div>
    </div>
  )
}
