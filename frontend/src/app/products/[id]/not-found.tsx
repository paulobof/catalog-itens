import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ProductNotFound() {
  return (
    <div>
      <PageHeader title="Produto não encontrado" backHref="/?tab=products" />
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden="true">
          📦
        </span>
        <h2 className="text-xl font-bold text-barbie-text">
          Produto não encontrado
        </h2>
        <p className="text-sm text-barbie-text/60">
          Este produto não existe ou foi removido.
        </p>
        <Link
          href="/?tab=products"
          className="rounded-xl bg-barbie-gradient px-6 py-2.5 font-semibold text-white shadow-md"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  )
}
