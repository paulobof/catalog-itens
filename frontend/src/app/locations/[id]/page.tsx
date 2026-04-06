import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getLocationById } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { FAB } from '@/components/layout/FAB'
import { Card, CardBody } from '@/components/ui/Card'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface LocationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const loc = await getLocationById(id)
    return { title: loc.name }
  } catch {
    return { title: 'Local' }
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
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

  const coverPhoto = location.photos?.[0]

  return (
    <div>
      <PageHeader
        title={location.name}
        backHref={`/rooms/${location.roomId}`}
        backLabel={`Voltar para ${location.roomName}`}
        actions={
          <Link
            href={`/locations/${location.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      <Breadcrumb
        items={[
          { label: 'Início', href: '/' },
          { label: location.roomName, href: `/rooms/${location.roomId}` },
          { label: location.name },
        ]}
      />

      {coverPhoto && (
        <div className="relative h-40 w-full">
          <Image
            src={coverPhoto.url}
            alt={`Foto de ${location.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="px-4 py-4">
        {location.description && (
          <p className="mb-4 text-sm text-barbie-text/70">
            {location.description}
          </p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-barbie-text">
            Produtos ({location.products.length})
          </h2>
        </div>

        {location.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">
              📦
            </span>
            <p className="text-sm text-barbie-text/60">
              Nenhum produto neste local ainda.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {location.products.map((product) => (
              <li key={product.productId}>
                <Link href={`/products/${product.productId}`} className="block">
                  <Card interactive className="overflow-hidden">
                    {product.thumbnailUrl ? (
                      <div className="relative h-32 w-full">
                        <Image
                          src={product.thumbnailUrl}
                          alt={product.productName}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
                        <span className="text-3xl" aria-hidden="true">📦</span>
                      </div>
                    )}
                    <CardBody className="pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-barbie-text">{product.productName}</span>
                        <span className="shrink-0 rounded-full bg-barbie-primary px-2 py-0.5 text-xs font-semibold text-white">
                          x{product.quantity}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FAB
        href={`/products/new?locationId=${location.id}`}
        label="Adicionar produto neste local"
      />
    </div>
  )
}
