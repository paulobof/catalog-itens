import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
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
  const thumbnail = location.photos[0]

  return (
    <Link
      href={`/locations/${location.id}`}
      className="block focus-visible:rounded-2xl"
    >
      <Card interactive>
        <div className="flex items-center gap-3 p-3">
          {thumbnail ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={thumbnail.thumbnailUrl}
                alt={`Foto de ${location.name}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-barbie-bg-soft">
              <LocationIcon />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-barbie-text">
              {location.name}
            </h3>
            {location.description && (
              <p className="truncate text-sm text-barbie-text/60">
                {location.description}
              </p>
            )}
            <p className="mt-1 text-xs text-barbie-dark">
              {location.productCount} item
              {location.productCount !== 1 ? 's' : ''}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className="shrink-0 text-barbie-accent"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Card>
    </Link>
  )
}
