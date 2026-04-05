import { Suspense } from 'react'
import { getRooms } from '@/lib/api/rooms'
import { Spinner } from '@/components/ui/Spinner'
import { HomeSearchBar } from '@/components/search/HomeSearchBar'
import { CatalogBrowser } from '@/components/catalog/CatalogBrowser'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Início',
}

export default async function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero header */}
      <div className="bg-barbie-gradient px-4 pb-6 pt-8">
        <h1 className="mb-1 text-2xl font-extrabold text-white">
          Catalog Itens
        </h1>
        <p className="mb-4 text-sm text-white/80">
          Encontre qualquer item da sua casa
        </p>
        <HomeSearchBar />
      </div>

      {/* One-page catalog browser */}
      <div className="px-4 py-4">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          }
        >
          <CatalogContent />
        </Suspense>
      </div>

    </div>
  )
}

async function CatalogContent() {
  const rooms = await getRooms()
  return <CatalogBrowser initialRooms={rooms} />
}
