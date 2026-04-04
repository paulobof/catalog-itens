import { Spinner } from '@/components/ui/Spinner'

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-barbie-bg-light">
      <Spinner size="lg" label="Carregando..." />
    </div>
  )
}
