'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import type { RoomSummary, TagResponse } from '@/lib/api/types'

interface SearchFiltersProps {
  rooms: RoomSummary[]
  tags: TagResponse[]
  selectedRoomId?: string
  selectedTagId?: string
}

export function SearchFilters({
  rooms,
  tags,
  selectedRoomId,
  selectedTagId,
}: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {rooms.length > 0 && (
        <div>
          <label htmlFor="room-filter" className="sr-only">
            Filtrar por cômodo
          </label>
          <select
            id="room-filter"
            value={selectedRoomId ?? ''}
            onChange={(e) => setParam('roomId', e.target.value || undefined)}
            className="w-full rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
          >
            <option value="">Todos os cômodos</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tags.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por tag"
        >
          {tags.map((tag) => {
            const isSelected = selectedTagId === tag.id
            return (
              <button
                key={tag.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() =>
                  setParam('tagId', isSelected ? undefined : tag.id)
                }
                style={
                  tag.color
                    ? {
                        backgroundColor: isSelected
                          ? tag.color
                          : `${tag.color}22`,
                        borderColor: tag.color,
                        color: isSelected ? '#fff' : tag.color,
                      }
                    : undefined
                }
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  !tag.color &&
                    (isSelected
                      ? 'border-barbie-primary bg-barbie-primary text-white'
                      : 'border-barbie-accent bg-barbie-bg-soft text-barbie-text hover:border-barbie-primary'),
                )}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
