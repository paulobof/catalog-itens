import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import type { LocationSummary } from '@/lib/api/types'

interface LocationCardProps {
  location: LocationSummary
}

function LocationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
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
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

export function LocationCard({ location }: LocationCardProps) {
  return (
    <Link
      href={`/locations/${location.id}`}
      className="block focus-visible:rounded-2xl"
    >
      <Card interactive className="overflow-hidden">
        {location.thumbnailUrl ? (
          <div className="relative h-32 w-full">
            <Image
              src={location.thumbnailUrl}
              alt={`Foto de ${location.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
            <LocationIcon />
          </div>
        )}
        <CardBody>
          <h3 className="truncate font-bold text-barbie-text">
            {location.name}
          </h3>
          {location.description && (
            <p className="mt-0.5 truncate text-sm text-barbie-text/60">
              {location.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-barbie-dark">
            <span>
              {location.productCount} item
              {location.productCount !== 1 ? 's' : ''}
            </span>
            <span className="text-barbie-text/40">{location.roomName}</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
