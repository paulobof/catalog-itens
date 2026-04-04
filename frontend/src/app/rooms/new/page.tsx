import { PageHeader } from '@/components/layout/PageHeader'
import { RoomForm } from '@/components/rooms/RoomForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Novo Cômodo' }

export default function NewRoomPage() {
  return (
    <div>
      <PageHeader
        title="Novo Cômodo"
        backHref="/"
        backLabel="Voltar para início"
      />
      <div className="px-4 py-6">
        <RoomForm />
      </div>
    </div>
  )
}
