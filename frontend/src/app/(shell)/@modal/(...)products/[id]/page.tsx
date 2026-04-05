'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import type { ProductDetail, TagResponse, ProductLocationResponse } from '@/lib/api/types'

interface ProductModalPageProps {
  params: Promise<{ id: string }>
}

export default function ProductModalPage({ params }: ProductModalPageProps) {
  const { id } = use(params)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data: ProductDetail = await res.json()
        if (!cancelled) setProduct(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produto')
        }
      }
    }

    fetchProduct()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <Sheet>
      {!product && !error && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-barbie-text/60">{error}</p>
        </div>
      )}

      {product && (
        <div className="pb-6">
          {/* Cover photo */}
          {product.photos?.[0] && (
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={product.photos[0].url}
                alt={`Foto de ${product.name}`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          {/* No photo placeholder */}
          {product.photos.length === 0 && (
            <div className="flex h-28 items-center justify-center bg-barbie-bg-soft">
              <span className="text-5xl" aria-hidden="true">
                📦
              </span>
            </div>
          )}

          <div className="px-4 pt-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold text-barbie-text leading-tight">
                {product.name}
              </h2>
              <Link
                href={`/products/${product.id}/edit`}
                className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft transition-colors"
              >
                Editar
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-barbie-text/80">
                {product.description}
              </p>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <section aria-label="Tags do produto">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: TagResponse) => (
                    <Badge key={tag.id} variant="custom" color={tag.color}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Locations */}
            {product.locations.length > 0 && (
              <section aria-label="Locais de armazenamento">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
                  Armazenado em
                </h3>
                <ul className="flex flex-col gap-2">
                  {product.locations.map((loc: ProductLocationResponse) => (
                    <li key={loc.locationId}>
                      <Link
                        href={`/locations/${loc.locationId}`}
                        className="flex items-center justify-between rounded-xl border border-barbie-accent/30 bg-barbie-surface px-3 py-2.5 hover:bg-barbie-bg-soft transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-barbie-text">
                            {loc.locationName}
                          </span>
                          <span className="text-xs text-barbie-text/50">
                            {loc.roomName}
                          </span>
                        </div>
                        <Badge variant="dark" className="shrink-0 ml-2">
                          x{loc.quantity}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm font-semibold text-barbie-dark">
                  Total: {product.totalQuantity} unidade
                  {product.totalQuantity !== 1 ? 's' : ''}
                </p>
              </section>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
