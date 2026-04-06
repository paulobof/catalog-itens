import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getRoomById } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { FAB } from '@/components/layout/FAB'
import { LocationCard } from '@/components/locations/LocationCard'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface RoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const room = await getRoomById(id)
    return { title: room.name }
  } catch {
    return { title: 'Cômodo' }
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params

  let room
  try {
    room = await getRoomById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const coverPhoto = room.photos?.[0]

  return (
    <div>
      <PageHeader
        title={room.name}
        backHref="/"
        backLabel="Voltar para início"
        actions={
          <Link
            href={`/rooms/${room.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      {coverPhoto && (
        <div className="relative h-48 w-full">
          <Image
            src={coverPhoto.url}
            alt={`Foto de ${room.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="px-4 py-4">
        {room.description && (
          <p className="mb-4 text-sm text-barbie-text/70">{room.description}</p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-barbie-text">
            Locais ({room.locations.length})
          </h2>
        </div>

        {room.locations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">
              📍
            </span>
            <p className="text-sm text-barbie-text/60">
              Nenhum local neste cômodo ainda.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {room.locations.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <FAB
        href={`/locations/new?roomId=${room.id}`}
        label="Adicionar local"
      />
    </div>
  )
}
