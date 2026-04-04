'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-barbie-bg-light px-4 text-center">
      <span className="text-6xl" aria-hidden="true">⚠️</span>
      <h1 className="text-2xl font-extrabold text-barbie-text">
        Algo deu errado
      </h1>
      <p className="max-w-sm text-sm text-barbie-text/60">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-barbie-text/30">
          ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} variant="primary">
        Tentar novamente
      </Button>
    </div>
  )
}
