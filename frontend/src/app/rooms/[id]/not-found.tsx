import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export default function RoomNotFound() {
  return (
    <div>
      <PageHeader title="Cômodo não encontrado" backHref="/" />
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden="true">
          🏠
        </span>
        <h2 className="text-xl font-bold text-barbie-text">
          Cômodo não encontrado
        </h2>
        <p className="text-sm text-barbie-text/60">
          Este cômodo não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-barbie-gradient px-6 py-2.5 font-semibold text-white shadow-md"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
