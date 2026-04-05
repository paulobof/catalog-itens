import { headers } from 'next/headers'
import { BottomNav } from '@/components/layout/BottomNav'
import { ToastContainer } from '@/components/ui/Toast'

export default async function ShellLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/'

  return (
    <div className="min-h-screen bg-barbie-bg-light">
      <main className="pb-20">{children}</main>
      <BottomNav activePath={pathname} />
      <ToastContainer />
      {modal}
    </div>
  )
}
