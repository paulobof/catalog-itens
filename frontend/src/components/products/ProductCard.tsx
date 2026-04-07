import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ProductSummary } from '@/lib/api/types'

interface ProductCardProps {
  product: ProductSummary
  quantityBadge?: number
  searchQuery?: string
}

export function ProductCard({ product, quantityBadge }: ProductCardProps) {
  const primaryTag = product.tags[0]

  return (
    <Link
      href={`/products/${product.id}`}
      className="block focus-visible:rounded-2xl"
    >
      <Card interactive className="overflow-hidden">
        {product.thumbnailUrl ? (
          <div className="relative h-40 w-full">
            <Image
              src={product.thumbnailUrl}
              alt={`Foto de ${product.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
            {quantityBadge !== undefined && (
              <span className="absolute right-2 top-2 rounded-lg bg-barbie-dark px-2 py-0.5 text-xs font-bold text-white shadow">
                x{quantityBadge}
              </span>
            )}
          </div>
        ) : (
          <div className="relative flex h-40 items-center justify-center bg-barbie-bg-soft">
            <span className="text-4xl" aria-hidden="true">
              📦
            </span>
            {quantityBadge !== undefined && (
              <span className="absolute right-2 top-2 rounded-lg bg-barbie-dark px-2 py-0.5 text-xs font-bold text-white shadow">
                x{quantityBadge}
              </span>
            )}
          </div>
        )}
        <CardBody className="pt-3">
          <h3 className="truncate font-bold text-barbie-text leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-barbie-text/60">
              {product.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {primaryTag && (
              <Badge variant="custom" color={primaryTag.color}>
                {primaryTag.name}
              </Badge>
            )}
            {product.tags.length > 1 && (
              <Badge variant="default">+{product.tags.length - 1}</Badge>
            )}
            {product.totalQuantity > 0 && (
              <span className="ml-auto text-xs text-barbie-dark font-medium">
                {product.totalQuantity} un.
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
