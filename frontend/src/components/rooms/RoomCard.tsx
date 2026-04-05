import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import type { RoomSummary } from '@/lib/api/types'

interface RoomCardProps {
  room: RoomSummary
}

function RoomIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="text-barbie-dark"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`} className="block focus-visible:rounded-2xl">
      <Card interactive className="overflow-hidden">
        {room.thumbnailUrl ? (
          <div className="relative h-32 w-full">
            <Image
              src={room.thumbnailUrl}
              alt={`Foto de ${room.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
            <RoomIcon />
          </div>
        )}
        <CardBody>
          <h2 className="truncate font-bold text-barbie-text">{room.name}</h2>
          {room.description && (
            <p className="mt-0.5 truncate text-sm text-barbie-text/60">
              {room.description}
            </p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-barbie-dark">
            <span>
              {room.locationCount} local{room.locationCount !== 1 ? 'is' : ''}
            </span>
            <span>
              {room.productCount} item{room.productCount !== 1 ? 's' : ''}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
