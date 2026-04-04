import { ProductCard } from './ProductCard'
import type { ProductSummary } from '@/lib/api/types'

interface ProductGridProps {
  products: ProductSummary[]
  emptyMessage?: string
}

export function ProductGrid({
  products,
  emptyMessage = 'Nenhum produto encontrado.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl" aria-hidden="true">
          📦
        </span>
        <p className="text-sm text-barbie-text/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
