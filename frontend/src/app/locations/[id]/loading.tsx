import { PageHeader } from '@/components/layout/PageHeader'

export default function LocationLoading() {
  return (
    <div>
      <PageHeader title="Carregando..." backHref="/" />
      <div className="animate-pulse px-4 py-4">
        <div className="mb-4 h-6 w-48 rounded-lg bg-barbie-bg-soft" />
        <div className="mb-4 h-40 rounded-2xl bg-barbie-bg-soft" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-barbie-bg-soft" />
          ))}
        </div>
      </div>
    </div>
  )
}
