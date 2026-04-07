'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('[login] submit start', { email })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })

      console.log('[login] response', res.status)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.warn('[login] failed', res.status, data)
        setError(data.message ?? `Falha (HTTP ${res.status})`)
        return
      }

      console.log('[login] success — navigating')
      window.location.href = '/'
    } catch (err) {
      console.error('[login] error', err)
      const message = err instanceof Error
        ? (err.name === 'AbortError' ? 'Timeout — servidor não respondeu' : err.message)
        : 'Erro de conexão'
      setError(message)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-barbie-bg-light px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-barbie-primary">
            SakaBof Catálogo
          </h1>
          <p className="mt-2 text-sm text-barbie-text/60">
            Digite suas credenciais para acessar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-semibold text-barbie-text">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text placeholder:text-barbie-text/40 focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold text-barbie-text">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text placeholder:text-barbie-text/40 focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-barbie-gradient px-4 py-2.5 font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
