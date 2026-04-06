import { notFound } from 'next/navigation'
import { getLocationById } from '@/lib/api/locations'
import { getRooms } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationForm } from '@/components/locations/LocationForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface EditLocationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditLocationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const loc = await getLocationById(id)
    return { title: `Editar ${loc.name}` }
  } catch {
    return { title: 'Editar Local' }
  }
}

export default async function EditLocationPage({
  params,
}: EditLocationPageProps) {
  const { id } = await params

  let location
  try {
    location = await getLocationById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const rooms = await getRooms()

  return (
    <div>
      <PageHeader
        title="Editar Local"
        backHref={`/locations/${location.id}`}
        backLabel={`Voltar para ${location.name}`}
      />
      <div className="px-4 py-6">
        <LocationForm location={location} rooms={rooms} existingPhotos={location.photos} />
      </div>
    </div>
  )
}
