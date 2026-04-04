import { notFound } from 'next/navigation'
import { getRoomById } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { RoomForm } from '@/components/rooms/RoomForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface EditRoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditRoomPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const room = await getRoomById(id)
    return { title: `Editar ${room.name}` }
  } catch {
    return { title: 'Editar Cômodo' }
  }
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
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

  return (
    <div>
      <PageHeader
        title="Editar Cômodo"
        backHref={`/rooms/${room.id}`}
        backLabel={`Voltar para ${room.name}`}
      />
      <div className="px-4 py-6">
        <RoomForm room={room} />
      </div>
    </div>
  )
}
