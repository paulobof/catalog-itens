import { PageHeader } from '@/components/layout/PageHeader'

export default function ProductLoading() {
  return (
    <div>
      <PageHeader title="Carregando..." backHref="/?tab=products" />
      <div className="animate-pulse">
        <div className="h-72 bg-barbie-bg-soft" />
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="h-4 w-3/4 rounded-lg bg-barbie-bg-soft" />
          <div className="h-4 w-1/2 rounded-lg bg-barbie-bg-soft" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-barbie-bg-soft" />
            <div className="h-6 w-16 rounded-full bg-barbie-bg-soft" />
          </div>
        </div>
      </div>
    </div>
  )
}
