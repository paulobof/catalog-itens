'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { FAB } from '@/components/layout/FAB'
import { showToast } from '@/components/ui/Toast'
import type {
  RoomSummary,
  LocationSummary,
  ProductSummary,
} from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type View = 'rooms' | 'locations' | 'products'

interface FilterChip {
  label: string
  id: string
}

interface CatalogBrowserProps {
  initialRooms: RoomSummary[]
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function RoomIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="text-barbie-dark">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="text-barbie-dark">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-barbie-text/40">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-barbie-accent">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogBrowser({ initialRooms }: CatalogBrowserProps) {
  const [view, setView] = useState<View>('rooms')
  const [rooms, setRooms] = useState<RoomSummary[]>(initialRooms)
  const [locations, setLocations] = useState<LocationSummary[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(false)

  // Search / text filter
  const [searchText, setSearchText] = useState('')

  // Active filters
  const [roomFilter, setRoomFilter] = useState<FilterChip | null>(null)
  const [locationFilter, setLocationFilter] = useState<FilterChip | null>(null)

  // Filtered lists based on search text
  const normalizedSearch = searchText.toLowerCase().trim()

  const filteredRooms = useMemo(
    () =>
      normalizedSearch
        ? rooms.filter((r) => r.name.toLowerCase().includes(normalizedSearch))
        : rooms,
    [rooms, normalizedSearch],
  )

  const filteredLocations = useMemo(
    () =>
      normalizedSearch
        ? locations.filter((l) => l.name.toLowerCase().includes(normalizedSearch))
        : locations,
    [locations, normalizedSearch],
  )

  const filteredProducts = useMemo(
    () =>
      normalizedSearch
        ? products.filter((p) => p.name.toLowerCase().includes(normalizedSearch))
        : products,
    [products, normalizedSearch],
  )

  // Drill into a room → show its locations
  const selectRoom = useCallback(async (room: RoomSummary) => {
    setLoading(true)
    setSearchText('')
    try {
      const res = await fetch(`/api/locations?roomId=${room.id}`)
      const data: LocationSummary[] = await res.json()
      setLocations(data)
      setRoomFilter({ id: room.id, label: room.name })
      setLocationFilter(null)
      setView('locations')
    } finally {
      setLoading(false)
    }
  }, [])

  // Drill into a location → show its products
  const selectLocation = useCallback(async (location: LocationSummary) => {
    setLoading(true)
    setSearchText('')
    try {
      const res = await fetch(`/api/locations/${location.id}`)
      const detail = await res.json()
      // detail.products has ProductInLocationResponse, we need to fetch full products
      // For now, fetch products filtered by roomId to get the ones in this location
      const productRes = await fetch(`/api/products?roomId=${roomFilter?.id}&size=50`)
      const productData = await productRes.json()
      // Filter products that are in this location
      const locationProductIds = new Set(
        detail.products.map((p: { productId: string }) => p.productId)
      )
      const filtered = productData.content.filter(
        (p: ProductSummary) => locationProductIds.has(p.id)
      )
      setProducts(filtered)
      setLocationFilter({ id: location.id, label: location.name })
      setView('products')
    } finally {
      setLoading(false)
    }
  }, [roomFilter])

  // Remove location filter → go back to locations
  const clearLocationFilter = useCallback(() => {
    setLocationFilter(null)
    setProducts([])
    setSearchText('')
    setView('locations')
  }, [])

  // Remove room filter → go back to rooms
  const clearRoomFilter = useCallback(() => {
    setRoomFilter(null)
    setLocationFilter(null)
    setLocations([])
    setProducts([])
    setSearchText('')
    setView('rooms')
  }, [])

  // Delete a room (soft-delete via API)
  const deleteRoom = useCallback(async (room: RoomSummary) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${room.name}?`)) return
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir')
      setRooms((prev) => prev.filter((r) => r.id !== room.id))
      showToast(`"${room.name}" excluído com sucesso.`, 'success')
    } catch {
      showToast('Erro ao excluir o cômodo. Tente novamente.', 'error')
    }
  }, [])

  // Delete a product (soft-delete via API)
  const deleteProduct = useCallback(async (product: ProductSummary) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${product.name}?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir')
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      showToast(`"${product.name}" excluído com sucesso.`, 'success')
    } catch {
      showToast('Erro ao excluir o produto. Tente novamente.', 'error')
    }
  }, [])

  // Delete a location (soft-delete via API)
  const deleteLocation = useCallback(async (location: LocationSummary) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${location.name}?`)) return
    try {
      const res = await fetch(`/api/locations/${location.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir')
      setLocations((prev) => prev.filter((l) => l.id !== location.id))
      showToast(`"${location.name}" excluído com sucesso.`, 'success')
    } catch {
      showToast('Erro ao excluir o local. Tente novamente.', 'error')
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb / Filter chips */}
      <nav aria-label="Navegacao do catalogo" className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clearRoomFilter}
          aria-label="Voltar para comodos"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'rooms'
              ? 'bg-barbie-primary text-white'
              : 'bg-barbie-bg-soft text-barbie-text/60 hover:bg-barbie-accent/20'
          }`}
        >
          Cômodos
        </button>

        {roomFilter && (
          <>
            <ChevronIcon />
            <button
              type="button"
              onClick={clearLocationFilter}
              aria-label={`Ver locais de ${roomFilter.label}`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === 'locations'
                  ? 'bg-barbie-primary text-white'
                  : 'bg-barbie-bg-soft text-barbie-text/60 hover:bg-barbie-accent/20'
              }`}
            >
              {roomFilter.label}
              {view === 'locations' && (
                <span
                  onClick={(e) => { e.stopPropagation(); clearRoomFilter() }}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/30 hover:bg-white/50"
                  aria-label={`Remover filtro ${roomFilter.label}`}
                >
                  <CloseIcon />
                </span>
              )}
            </button>
          </>
        )}

        {locationFilter && (
          <>
            <ChevronIcon />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-barbie-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              {locationFilter.label}
              <span
                onClick={(e) => { e.stopPropagation(); clearLocationFilter() }}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 cursor-pointer"
                aria-label={`Remover filtro ${locationFilter.label}`}
              >
                <CloseIcon />
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Search / filter bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          aria-label={
            view === 'rooms'
              ? 'Filtrar comodos'
              : view === 'locations'
                ? 'Filtrar locais'
                : 'Filtrar produtos'
          }
          placeholder={
            view === 'rooms'
              ? 'Filtrar comodos...'
              : view === 'locations'
                ? 'Filtrar locais...'
                : 'Filtrar produtos...'
          }
          className="w-full rounded-xl border border-barbie-accent/20 bg-white py-2 pl-9 pr-9 text-sm text-barbie-text placeholder:text-barbie-text/40 focus:border-barbie-primary focus:outline-none focus:ring-1 focus:ring-barbie-primary"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText('')}
            className="absolute inset-y-0 right-3 flex items-center text-barbie-text/40 hover:text-barbie-text/70"
            aria-label="Limpar busca"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Rooms grid */}
      {!loading && view === 'rooms' && (
        filteredRooms.length === 0 ? (
          normalizedSearch ? (
            <EmptyState emoji="🔍" message={`Nenhum cômodo encontrado para "${searchText}".`} href="/rooms/new" cta="Criar primeiro cômodo" />
          ) : (
            <EmptyState emoji="🏠" message="Nenhum cômodo cadastrado ainda." href="/rooms/new" cta="Criar primeiro cômodo" />
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredRooms.map((room) => (
              <li key={room.id}>
                <button type="button" onClick={() => selectRoom(room)} className="block w-full text-left">
                  <Card interactive className="overflow-hidden">
                    <div className="group/card relative">
                      {room.thumbnailUrl ? (
                        <div className="relative h-32 w-full">
                          <Image src={room.thumbnailUrl} alt={room.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
                          <RoomIcon />
                        </div>
                      )}
                      <div className="absolute right-1.5 top-1.5 flex gap-1">
                        <Link
                          href={`/rooms/${room.id}/edit`}
                          aria-label={`Editar ${room.name}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-barbie-primary hover:text-white transition-colors"
                        >
                          <EditIcon />
                        </Link>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Excluir ${room.name}`}
                          onClick={(e) => { e.stopPropagation(); deleteRoom(room) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); deleteRoom(room) } }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <TrashIcon />
                        </span>
                      </div>
                    </div>
                    <CardBody>
                      <h3 className="truncate font-bold text-barbie-text text-sm">{room.name}</h3>
                      {room.description && (
                        <p className="mt-0.5 truncate text-xs text-barbie-text/60">{room.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-barbie-dark">
                        {room.locationCount} local{room.locationCount !== 1 ? 'is' : ''} · {room.productCount} item{room.productCount !== 1 ? 's' : ''}
                      </p>
                    </CardBody>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Locations grid */}
      {!loading && view === 'locations' && (
        filteredLocations.length === 0 ? (
          normalizedSearch ? (
            <EmptyState
              emoji="🔍"
              message={`Nenhum local encontrado para "${searchText}".`}
              href={`/locations/new?roomId=${roomFilter?.id}`}
              cta="Criar primeiro local"
            />
          ) : (
            <EmptyState
              emoji="📍"
              message={`Nenhum local em "${roomFilter?.label}" ainda.`}
              href={`/locations/new?roomId=${roomFilter?.id}`}
              cta="Criar primeiro local"
            />
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredLocations.map((loc) => (
              <li key={loc.id}>
                <button type="button" onClick={() => selectLocation(loc)} className="block w-full text-left">
                  <Card interactive className="overflow-hidden">
                    <div className="group/card relative">
                      {loc.thumbnailUrl ? (
                        <div className="relative h-32 w-full">
                          <Image src={loc.thumbnailUrl} alt={loc.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
                          <LocationIcon />
                        </div>
                      )}
                      <div className="absolute right-1.5 top-1.5 flex gap-1">
                        <Link
                          href={`/locations/${loc.id}/edit`}
                          aria-label={`Editar ${loc.name}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-barbie-primary hover:text-white transition-colors"
                        >
                          <EditIcon />
                        </Link>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Excluir ${loc.name}`}
                          onClick={(e) => { e.stopPropagation(); deleteLocation(loc) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); deleteLocation(loc) } }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <TrashIcon />
                        </span>
                      </div>
                    </div>
                    <CardBody>
                      <h3 className="truncate font-bold text-barbie-text text-sm">{loc.name}</h3>
                      {loc.description && (
                        <p className="mt-0.5 truncate text-xs text-barbie-text/60">{loc.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-barbie-dark">
                        {loc.productCount} item{loc.productCount !== 1 ? 's' : ''}
                      </p>
                    </CardBody>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Products grid */}
      {!loading && view === 'products' && (
        filteredProducts.length === 0 ? (
          normalizedSearch ? (
            <EmptyState
              emoji="🔍"
              message={`Nenhum produto encontrado para "${searchText}".`}
              href={`/products/new?locationId=${locationFilter?.id}`}
              cta="Criar primeiro produto"
            />
          ) : (
            <EmptyState
              emoji="📦"
              message={`Nenhum produto em "${locationFilter?.label}" ainda.`}
              href={`/products/new?locationId=${locationFilter?.id}`}
              cta="Criar primeiro produto"
            />
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <Link href={`/products/${product.id}`} className="block">
                  <Card interactive className="overflow-hidden">
                    <div className="relative">
                      {product.photos?.[0] ? (
                        <div className="relative h-32 w-full">
                          <Image src={product.photos[0].thumbnailUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
                          <span className="text-3xl" aria-hidden="true">📦</span>
                        </div>
                      )}
                      <div className="absolute right-1.5 top-1.5 flex gap-1">
                        <Link
                          href={`/products/${product.id}/edit`}
                          aria-label={`Editar ${product.name}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-barbie-primary hover:text-white transition-colors"
                        >
                          <EditIcon />
                        </Link>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Excluir ${product.name}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteProduct(product) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); deleteProduct(product) } }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <TrashIcon />
                        </span>
                      </div>
                    </div>
                    <CardBody className="pt-3">
                      <h3 className="truncate font-bold text-barbie-text text-sm">{product.name}</h3>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-barbie-text/60">{product.description}</p>
                      )}
                      {product.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <Badge variant="custom" color={product.tags[0]?.color}>
                            {product.tags[0]?.name}
                          </Badge>
                          {product.tags.length > 1 && (
                            <Badge variant="default">+{product.tags.length - 1}</Badge>
                          )}
                        </div>
                      )}
                      {product.totalQuantity > 0 && (
                        <p className="mt-1 text-xs text-barbie-dark font-medium">
                          {product.totalQuantity} un.
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}

      {/* Context-aware FAB */}
      <FAB
        href={
          view === 'rooms'
            ? '/rooms/new'
            : view === 'locations'
              ? `/locations/new?roomId=${roomFilter?.id}`
              : `/products/new?locationId=${locationFilter?.id}`
        }
        label={
          view === 'rooms'
            ? 'Adicionar cômodo'
            : view === 'locations'
              ? 'Adicionar local'
              : 'Adicionar produto'
        }
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state helper
// ---------------------------------------------------------------------------

function EmptyState({
  emoji,
  message,
  href,
  cta,
}: {
  emoji: string
  message: string
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">{emoji}</span>
      <p className="text-barbie-text/60">{message}</p>
      <Link
        href={href}
        aria-label={cta}
        className="rounded-xl bg-barbie-gradient px-6 py-2 text-sm font-semibold text-white shadow-md"
      >
        {cta}
      </Link>
    </div>
  )
}
