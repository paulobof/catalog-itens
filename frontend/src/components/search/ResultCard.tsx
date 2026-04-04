import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { highlightSegments } from '@/lib/utils/highlight'
import type { ProductSummary } from '@/lib/api/types'

interface ResultCardProps {
  product: ProductSummary
  query: string
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query)
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            className="rounded bg-barbie-accent/30 px-0.5 text-barbie-text not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export function ResultCard({ product, query }: ResultCardProps) {
  const thumbnail = product.photos[0]

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-start gap-3 rounded-2xl border border-barbie-accent/20 bg-barbie-surface p-3 hover:bg-barbie-bg-soft transition-colors focus-visible:rounded-2xl"
    >
      {thumbnail ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={thumbnail.thumbnailUrl}
            alt={`Foto de ${product.name}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-barbie-bg-soft text-3xl">
          📦
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-barbie-text leading-tight">
          <HighlightedText text={product.name} query={query} />
        </h3>

        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-barbie-text/60">
            <HighlightedText text={product.description} query={query} />
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <Badge key={tag.id} variant="custom" color={tag.color}>
              {tag.name}
            </Badge>
          ))}
        </div>

        {product.totalQuantity > 0 && (
          <p className="mt-1 text-xs font-medium text-barbie-dark">
            {product.totalQuantity} un. em {product.locationCount} local
            {product.locationCount !== 1 ? 'is' : ''}
          </p>
        )}
      </div>
    </Link>
  )
}
