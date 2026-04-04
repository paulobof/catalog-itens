import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/api/products'
import { getTags } from '@/lib/api/tags'
import { getLocations } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/products/ProductForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProductById(id)
    return { title: `Editar ${product.name}` }
  } catch {
    return { title: 'Editar Produto' }
  }
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
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

  const [tags, locations] = await Promise.all([getTags(), getLocations()])

  return (
    <div>
      <PageHeader
        title="Editar Produto"
        backHref={`/products/${product.id}`}
        backLabel={`Voltar para ${product.name}`}
      />
      <div className="px-4 py-6">
        <ProductForm
          product={product}
          allTags={tags}
          allLocations={locations}
        />
      </div>
    </div>
  )
}
