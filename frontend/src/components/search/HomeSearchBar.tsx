'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function HomeSearchBar() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/search')
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search">
      <label htmlFor="home-search" className="sr-only">
        Buscar itens
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
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
          ref={inputRef}
          id="home-search"
          type="search"
          placeholder="Buscar produtos, cômodos..."
          autoComplete="off"
          className="w-full rounded-xl border border-white/30 bg-white/20 py-2.5 pl-10 pr-4 text-white placeholder:text-white/70 focus:border-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
    </form>
  )
}
