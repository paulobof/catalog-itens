'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { LocationCard } from '@/components/locations/LocationCard'
import type { RoomDetail, LocationSummary } from '@/lib/api/types'

interface RoomModalPageProps {
  params: Promise<{ id: string }>
}

export default function RoomModalPage({ params }: RoomModalPageProps) {
  const { id } = use(params)
  const [room, setRoom] = useState<RoomDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${id}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data: RoomDetail = await res.json()
        if (!cancelled) setRoom(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar cômodo')
        }
      }
    }

    fetchRoom()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <Sheet>
      {!room && !error && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-barbie-text/60">{error}</p>
        </div>
      )}

      {room && (
        <div className="pb-6">
          {/* Cover photo */}
          {room.photos?.[0] && (
            <div className="relative h-44 w-full">
              <Image
                src={room.photos[0].url}
                alt={`Foto de ${room.name}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="px-4 pt-4">
            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold text-barbie-text leading-tight">
                {room.name}
              </h2>
              <Link
                href={`/rooms/${room.id}/edit`}
                className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft transition-colors"
              >
                Editar
              </Link>
            </div>

            {room.description && (
              <p className="mb-4 text-sm text-barbie-text/70 leading-relaxed">
                {room.description}
              </p>
            )}

            {/* Locations section */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-barbie-text">
                Locais ({room.locations.length})
              </h3>
              <Link
                href={`/locations/new?roomId=${room.id}`}
                className="text-xs font-semibold text-barbie-primary hover:underline"
              >
                + Adicionar local
              </Link>
            </div>

            {room.locations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl" aria-hidden="true">
                  📍
                </span>
                <p className="text-sm text-barbie-text/60">
                  Nenhum local neste cômodo ainda.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3">
                {room.locations.map((location: LocationSummary) => (
                  <li key={location.id}>
                    <LocationCard location={location} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
