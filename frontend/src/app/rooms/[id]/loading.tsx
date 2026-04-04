import { PageHeader } from '@/components/layout/PageHeader'

export default function RoomLoading() {
  return (
    <div>
      <PageHeader title="Carregando..." backHref="/" />
      <div className="animate-pulse px-4 py-4">
        <div className="mb-4 h-48 rounded-2xl bg-barbie-bg-soft" />
        <div className="mb-3 h-5 w-32 rounded-lg bg-barbie-bg-soft" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-barbie-bg-soft" />
          ))}
        </div>
      </div>
    </div>
  )
}
