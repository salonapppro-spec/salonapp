'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-brand-50 via-[#FFF8F5] to-brand-100/80 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700 mb-2">SalonApp.pro</p>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900 mb-4">Провери имейла си</h1>
          <p className="text-brand-800/80 text-sm leading-relaxed">
            Изпратихме линк за смяна на паролата на{' '}
            <strong className="text-brand-900">{email}</strong>.
          </p>
          <a
            href="/admin/login"
            className="mt-6 inline-block text-sm text-brand-600 hover:underline"
          >
            Обратно към вход
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-brand-50 via-[#FFF8F5] to-brand-100/80">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-300/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 safe-pt safe-pb sm:px-6">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">SalonApp.pro</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
            Забравена парола
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-brand-800/80 sm:text-base">
            Въведи имейла си и ще получиш линк за смяна на паролата.
          </p>
        </div>

        <div className="rounded-3xl border border-brand-200/70 bg-white/95 p-6 shadow-card-lg backdrop-blur-md sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="forgot-email" className="text-sm font-medium text-brand-900">
                Имейл
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="input-admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="твоя@имейл.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-admin-primary w-full text-base"
            >
              {loading ? 'Изпращане…' : 'Изпрати линк'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <a href="/admin/login" className="text-brand-600 hover:underline">
              Обратно към вход
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
