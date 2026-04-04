'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition, useCallback, useRef, useEffect } from 'react'

interface SearchInputProps {
  initialQuery: string
}

export function SearchInput({ initialQuery }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page')
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(value), 300)
  }

  function handleClear() {
    setQuery('')
    navigate('')
  }

  return (
    <div className="relative">
      <label htmlFor="search-input" className="sr-only">
        Buscar produtos
      </label>
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-barbie-accent"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>
      <input
        id="search-input"
        type="search"
        autoFocus
        autoComplete="off"
        value={query}
        onChange={handleChange}
        placeholder="Buscar produtos..."
        className="w-full rounded-xl border border-barbie-accent bg-white py-2.5 pl-10 pr-10 text-barbie-text placeholder:text-barbie-accent/70 focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-barbie-accent hover:text-barbie-dark"
        >
          ✕
        </button>
      )}
    </div>
  )
}
