'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import type { TagResponse } from '@/lib/api/types'

interface TagPickerProps {
  allTags: TagResponse[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateTag?: (name: string) => Promise<TagResponse>
  label?: string
  error?: string
}

export function TagPicker({
  allTags,
  selectedIds,
  onChange,
  onCreateTag,
  label = 'Tags',
  error,
}: TagPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredTags = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) &&
      !selectedIds.includes(t.id),
  )

  const exactMatch = allTags.find(
    (t) => t.name.toLowerCase() === query.toLowerCase(),
  )

  const showCreateOption =
    query.trim().length > 0 && !exactMatch && onCreateTag !== undefined

  function toggleTag(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
      setQuery('')
      inputRef.current?.focus()
    }
  }

  async function handleCreate() {
    if (!onCreateTag || !query.trim()) return
    setCreating(true)
    try {
      const newTag = await onCreateTag(query.trim())
      onChange([...selectedIds, newTag.id])
      setQuery('')
    } finally {
      setCreating(false)
      setOpen(false)
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const firstFiltered = filteredTags[0]
        if (filteredTags.length === 1 && firstFiltered) {
          toggleTag(firstFiltered.id)
        } else if (showCreateOption) {
          void handleCreate()
        }
      }
      if (e.key === 'Backspace' && query === '' && selectedIds.length > 0) {
        onChange(selectedIds.slice(0, -1))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredTags, query, selectedIds, showCreateOption],
  )

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id))

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-barbie-text">{label}</label>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-1.5 rounded-xl border border-barbie-accent bg-white p-2 focus-within:border-barbie-primary focus-within:ring-2 focus-within:ring-barbie-primary/30',
          error &&
            'border-red-400 focus-within:border-red-500 focus-within:ring-red-200',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: tag.color ? `${tag.color}33` : undefined,
              color: tag.color ?? '#880e4f',
              borderColor: tag.color ? `${tag.color}66` : '#f48fb1',
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleTag(tag.id)
              }}
              aria-label={`Remover tag ${tag.name}`}
              className="ml-0.5 opacity-60 hover:opacity-100 text-inherit"
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length === 0 ? 'Buscar ou criar tag...' : ''}
          aria-label="Buscar tags"
          aria-autocomplete="list"
          className="min-w-[120px] flex-1 bg-transparent text-sm text-barbie-text outline-none placeholder:text-barbie-accent/70"
        />
      </div>

      {open && (filteredTags.length > 0 || showCreateOption) && (
        <ul
          role="listbox"
          aria-label="Sugestões de tags"
          className="z-50 max-h-48 overflow-y-auto rounded-xl border border-barbie-accent/50 bg-white shadow-card"
        >
          {filteredTags.map((tag) => (
            <li key={tag.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-barbie-bg-soft"
              >
                {tag.color && (
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{
                      backgroundColor: tag.color,
                      borderColor: tag.color,
                    }}
                    aria-hidden="true"
                  />
                )}
                {tag.name}
              </button>
            </li>
          ))}

          {showCreateOption && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex w-full items-center gap-2 border-t border-barbie-accent/20 px-3 py-2 text-sm font-medium text-barbie-primary hover:bg-barbie-bg-soft disabled:opacity-50"
              >
                {creating ? (
                  <span className="text-barbie-text/50">Criando...</span>
                ) : (
                  <>
                    <span aria-hidden="true">+</span>
                    Criar tag &ldquo;{query.trim()}&rdquo;
                  </>
                )}
              </button>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
