'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
        setError(null)
      }
    })

    const initializeRecoverySession = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const type = url.searchParams.get('type')

      // Some email clients open the recovery link as ?code=...&type=recovery.
      if (code && type === 'recovery') {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError('Линкът за смяна на парола е невалиден или е изтекъл.')
          return
        }
        window.history.replaceState({}, '', '/admin/reset-password')
      }

      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError('Линкът за смяна на парола е невалиден или е изтекъл.')
        return
      }

      if (data.session) {
        setReady(true)
        return
      }

      setError('Отвори страницата през линка от имейла за смяна на парола.')
    }

    void initializeRecoverySession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Паролата трябва да е поне 8 символа.')
      return
    }
    if (password !== confirmPassword) {
      setError('Паролите не съвпадат.')
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
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
            Смени паролата
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-brand-800/80 sm:text-base">
            Въведи новата парола за админ акаунта.
          </p>
        </div>

        <div className="rounded-3xl border border-brand-200/70 bg-white/95 p-6 shadow-card-lg backdrop-blur-md sm:p-8">
          {error ? (
            <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          {done ? (
            <div className="text-center">
              <p className="text-sm text-brand-900">Паролата е сменена успешно.</p>
              <a href="/admin/login" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
                Върни се към вход
              </a>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-password" className="text-sm font-medium text-brand-900">
                  Нова парола
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready || loading}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="text-sm font-medium text-brand-900">
                  Потвърди паролата
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-admin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!ready || loading}
                />
              </div>
              <button type="submit" disabled={!ready || loading} className="btn-admin-primary w-full text-base">
                {loading ? 'Записване…' : 'Запази новата парола'}
              </button>
            </form>
          )}

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
