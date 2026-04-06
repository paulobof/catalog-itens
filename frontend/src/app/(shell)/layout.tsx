import { headers } from 'next/headers'
import { BottomNav } from '@/components/layout/BottomNav'
import { LogoutButton } from '@/components/layout/LogoutButton'
import { ToastContainer } from '@/components/ui/Toast'

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/'

  return (
    <div className="min-h-screen bg-barbie-bg-light">
      <div className="flex justify-end px-3 pt-2">
        <LogoutButton />
      </div>
      <main className="pb-20">{children}</main>
      <BottomNav activePath={pathname} />
      <ToastContainer />
    </div>
  )
}
