import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductById } from '@/lib/api/products'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { PhotoCarousel } from '@/components/photos/PhotoCarousel'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProductById(id)
    return {
      title: product.name,
      description: product.description ?? undefined,
    }
  } catch {
    return { title: 'Produto' }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  let product
  try {
    product = await getProductById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        backHref="/?tab=products"
        backLabel="Voltar para produtos"
        actions={
          <Link
            href={`/products/${product.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      {product.photos.length > 0 && (
        <PhotoCarousel photos={product.photos} productName={product.name} />
      )}

      <div className="px-4 py-4 flex flex-col gap-5">
        {product.description && (
          <p className="text-sm leading-relaxed text-barbie-text/80">
            {product.description}
          </p>
        )}

        {product.tags.length > 0 && (
          <section aria-label="Tags do produto">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag.id} variant="custom" color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {product.locations.length > 0 && (
          <section aria-label="Locais de armazenamento">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
              Armazenado em
            </h2>
            <ul className="flex flex-col gap-2">
              {product.locations.map((loc) => (
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
  )
}
