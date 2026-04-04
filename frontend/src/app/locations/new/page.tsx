import { getRooms } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationForm } from '@/components/locations/LocationForm'
import type { Metadata } from 'next'

interface NewLocationPageProps {
  searchParams: Promise<{ roomId?: string }>
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Novo Local' }

export default async function NewLocationPage({
  searchParams,
}: NewLocationPageProps) {
  const { roomId } = await searchParams
  const rooms = await getRooms()

  return (
    <div>
      <PageHeader
        title="Novo Local"
        backHref={roomId ? `/rooms/${roomId}` : '/'}
        backLabel="Voltar"
      />
      <div className="px-4 py-6">
        <LocationForm rooms={rooms} defaultRoomId={roomId} />
      </div>
    </div>
  )
}
