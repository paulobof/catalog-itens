import { Suspense } from 'react'
import Link from 'next/link'
import { getRooms } from '@/lib/api/rooms'
import { getProducts } from '@/lib/api/products'
import { RoomCard } from '@/components/rooms/RoomCard'
import { ProductCard } from '@/components/products/ProductCard'
import { Spinner } from '@/components/ui/Spinner'
import { FAB } from '@/components/layout/FAB'
import { HomeSearchBar } from '@/components/search/HomeSearchBar'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Início',
}

interface HomePageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tab = 'rooms' } = await searchParams
  const activeTab = tab === 'products' ? 'products' : 'rooms'

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

      {/* Tab navigation */}
      <div className="sticky top-0 z-20 flex border-b border-barbie-accent/30 bg-barbie-surface">
        <Link
          href="/?tab=rooms"
          replace
          aria-selected={activeTab === 'rooms'}
          role="tab"
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === 'rooms'
              ? 'border-b-2 border-barbie-primary text-barbie-primary'
              : 'text-barbie-text/50 hover:text-barbie-dark'
          }`}
        >
          Cômodos
        </Link>
        <Link
          href="/?tab=products"
          replace
          aria-selected={activeTab === 'products'}
          role="tab"
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === 'products'
              ? 'border-b-2 border-barbie-primary text-barbie-primary'
              : 'text-barbie-text/50 hover:text-barbie-dark'
          }`}
        >
          Produtos
        </Link>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4" role="tabpanel">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          }
        >
          {activeTab === 'rooms' ? <RoomsTab /> : <ProductsTab />}
        </Suspense>
      </div>

      <FAB
        href={activeTab === 'rooms' ? '/rooms/new' : '/products/new'}
        label={
          activeTab === 'rooms' ? 'Adicionar cômodo' : 'Adicionar produto'
        }
      />
    </div>
  )
}

async function RoomsTab() {
  const rooms = await getRooms()

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden="true">
          🏠
        </span>
        <p className="text-barbie-text/60">Nenhum cômodo cadastrado ainda.</p>
        <Link
          href="/rooms/new"
          className="rounded-xl bg-barbie-gradient px-6 py-2 text-sm font-semibold text-white shadow-md"
        >
          Criar primeiro cômodo
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomCard room={room} />
        </li>
      ))}
    </ul>
  )
}

async function ProductsTab() {
  const result = await getProducts({ size: 20 })

  if (result.content.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden="true">
          📦
        </span>
        <p className="text-barbie-text/60">Nenhum produto cadastrado ainda.</p>
        <Link
          href="/products/new"
          className="rounded-xl bg-barbie-gradient px-6 py-2 text-sm font-semibold text-white shadow-md"
        >
          Criar primeiro produto
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {result.content.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
