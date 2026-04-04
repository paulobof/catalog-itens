import { getTags } from '@/lib/api/tags'
import { getLocations } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/products/ProductForm'
import type { Metadata } from 'next'

interface NewProductPageProps {
  searchParams: Promise<{ locationId?: string }>
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Novo Produto' }

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const { locationId } = await searchParams

  const [tags, locations] = await Promise.all([getTags(), getLocations()])

  return (
    <div>
      <PageHeader
        title="Novo Produto"
        backHref={locationId ? `/locations/${locationId}` : '/?tab=products'}
        backLabel="Voltar"
      />
      <div className="px-4 py-6">
        <ProductForm
          allTags={tags}
          allLocations={locations}
          defaultLocationId={locationId}
        />
      </div>
    </div>
  )
}
