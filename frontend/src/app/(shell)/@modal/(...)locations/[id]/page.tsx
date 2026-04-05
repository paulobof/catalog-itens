'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { LocationDetail, ProductInLocationResponse } from '@/lib/api/types'

interface LocationModalPageProps {
  params: Promise<{ id: string }>
}

export default function LocationModalPage({ params }: LocationModalPageProps) {
  const { id } = use(params)
  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchLocation() {
      try {
        const res = await fetch(`/api/locations/${id}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data: LocationDetail = await res.json()
        if (!cancelled) setLocation(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar local')
        }
      }
    }

    fetchLocation()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <Sheet>
      {!location && !error && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-barbie-text/60">{error}</p>
        </div>
      )}

      {location && (
        <div className="pb-6">
          {/* Cover photo */}
          {location.photos?.[0] && (
            <div className="relative h-40 w-full">
              <Image
                src={location.photos[0].url}
                alt={`Foto de ${location.name}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="px-4 pt-4">
            {/* Breadcrumb */}
            <nav aria-label="Localização" className="mb-2 flex items-center gap-1 text-xs text-barbie-text/50">
              <Link href="/" className="hover:text-barbie-primary transition-colors">
                Início
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={`/rooms/${location.roomId}`}
                className="hover:text-barbie-primary transition-colors"
              >
                {location.roomName}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-barbie-text/70">{location.name}</span>
            </nav>

            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold text-barbie-text leading-tight">
                {location.name}
              </h2>
              <Link
                href={`/locations/${location.id}/edit`}
                className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft transition-colors"
              >
                Editar
              </Link>
            </div>

            {location.description && (
              <p className="mb-4 text-sm text-barbie-text/70 leading-relaxed">
                {location.description}
              </p>
            )}

            {/* Products section */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-barbie-text">
                Produtos ({location.products.length})
              </h3>
              <Link
                href={`/products/new?locationId=${location.id}`}
                className="text-xs font-semibold text-barbie-primary hover:underline"
              >
                + Adicionar produto
              </Link>
            </div>

            {location.products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl" aria-hidden="true">
                  📦
                </span>
                <p className="text-sm text-barbie-text/60">
                  Nenhum produto neste local ainda.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {location.products.map((product: ProductInLocationResponse) => (
                  <li key={product.productId}>
                    <Link href={`/products/${product.productId}`} className="block">
                      <Card interactive>
                        <CardBody>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-barbie-text">
                              {product.productName}
                            </span>
                            <Badge variant="dark">x{product.quantity}</Badge>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
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
