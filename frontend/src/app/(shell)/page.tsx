import { Suspense } from 'react'
import Link from 'next/link'
import { getRooms } from '@/lib/api/rooms'
import { getLocations } from '@/lib/api/locations'
import { getProducts } from '@/lib/api/products'
import { RoomCard } from '@/components/rooms/RoomCard'
import { LocationCard } from '@/components/locations/LocationCard'
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

const TABS = ['rooms', 'locations', 'products'] as const
type Tab = (typeof TABS)[number]

function resolveTab(tab?: string): Tab {
  if (tab === 'locations') return 'locations'
  if (tab === 'products') return 'products'
  return 'rooms'
}

const TAB_CONFIG: Record<Tab, { label: string; fabHref: string; fabLabel: string }> = {
  rooms: { label: 'Cômodos', fabHref: '/rooms/new', fabLabel: 'Adicionar cômodo' },
  locations: { label: 'Locais', fabHref: '/locations/new', fabLabel: 'Adicionar local' },
  products: { label: 'Produtos', fabHref: '/products/new', fabLabel: 'Adicionar produto' },
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tab } = await searchParams
  const activeTab = resolveTab(tab)

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
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/?tab=${t}`}
            replace
            aria-selected={activeTab === t}
            role="tab"
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === t
                ? 'border-b-2 border-barbie-primary text-barbie-primary'
                : 'text-barbie-text/50 hover:text-barbie-dark'
            }`}
          >
            {TAB_CONFIG[t].label}
          </Link>
        ))}
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
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'locations' && <LocationsTab />}
          {activeTab === 'products' && <ProductsTab />}
        </Suspense>
      </div>

      <FAB
        href={TAB_CONFIG[activeTab].fabHref}
        label={TAB_CONFIG[activeTab].fabLabel}
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

async function LocationsTab() {
  const locations = await getLocations()

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden="true">
          📍
        </span>
        <p className="text-barbie-text/60">Nenhum local cadastrado ainda.</p>
        <Link
          href="/locations/new"
          className="rounded-xl bg-barbie-gradient px-6 py-2 text-sm font-semibold text-white shadow-md"
        >
          Criar primeiro local
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => (
        <li key={location.id}>
          <LocationCard location={location} />
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
