import { Suspense } from 'react'
import { getProducts } from '@/lib/api/products'
import { getRooms } from '@/lib/api/rooms'
import { getTags } from '@/lib/api/tags'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/search/SearchInput'
import { SearchFilters } from '@/components/search/SearchFilters'
import { ResultCard } from '@/components/search/ResultCard'
import { Spinner } from '@/components/ui/Spinner'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Buscar' }

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    roomId?: string
    tagId?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, roomId, tagId, page } = await searchParams
  const [rooms, tags] = await Promise.all([getRooms(), getTags()])

  return (
    <div>
      <PageHeader title="Buscar" />

      <div className="sticky top-[57px] z-20 border-b border-barbie-accent/20 bg-barbie-surface px-4 py-3 flex flex-col gap-2">
        <Suspense
          fallback={
            <div className="h-10 rounded-xl bg-barbie-bg-soft animate-pulse" />
          }
        >
          <SearchInput initialQuery={q ?? ''} />
        </Suspense>
        <Suspense
          fallback={
            <div className="h-8 rounded-xl bg-barbie-bg-soft animate-pulse" />
          }
        >
          <SearchFilters
            rooms={rooms}
            tags={tags}
            selectedRoomId={roomId}
            selectedTagId={tagId}
          />
        </Suspense>
      </div>

      <div className="px-4 py-4">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          }
        >
          <SearchResults
            q={q}
            roomId={roomId}
            tagId={tagId}
            page={page ? parseInt(page, 10) : 0}
          />
        </Suspense>
      </div>
    </div>
  )
}

interface SearchResultsProps {
  q?: string
  roomId?: string
  tagId?: string
  page: number
}

async function SearchResults({ q, roomId, tagId, page }: SearchResultsProps) {
  const result = await getProducts({ q, roomId, tagId, page, size: 20 })
  const hasFilters = !!(q || roomId || tagId)

  return (
    <div>
      <p
        aria-live="polite"
        aria-atomic="true"
        className="mb-3 text-sm text-barbie-text/60"
      >
        {result.page.totalElements} resultado
        {result.page.totalElements !== 1 ? 's' : ''}
        {q && ` para "${q}"`}
      </p>

      {result.content.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">
            🔍
          </span>
          <h2 className="text-lg font-bold text-barbie-text">
            Nenhum resultado encontrado
          </h2>
          <p className="text-sm text-barbie-text/60">
            Tente outros termos ou remova os filtros.
          </p>
          {hasFilters && (
            <a
              href="/search"
              className="rounded-xl bg-barbie-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              Limpar filtros
            </a>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.content.map((product) => (
            <li key={product.id}>
              <ResultCard product={product} query={q ?? ''} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
