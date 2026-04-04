# Plan 2: Frontend Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Next.js 15 frontend with Barbie theme, PWA support, responsive design, and full CRUD for rooms, locations, products, tags, and photos.

**Architecture:** Next.js 15 App Router with Server Components by default, Client Components only for interactive UI (forms, carousel, search). Route groups for shell layout. URL-driven search/filter state.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, SWR, React Hook Form, TypeScript

---

## Task 1 — Project scaffolding

- [ ] From `D:/Projetos/catalog-itens/`, run the scaffolding command:

```bash
cd D:/Projetos/catalog-itens
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --turbopack
```

- [ ] Install runtime dependencies:

```bash
cd D:/Projetos/catalog-itens/frontend
npm install swr react-hook-form clsx tailwind-merge
```

- [ ] Install dev dependencies:

```bash
npm install -D @types/node
```

- [ ] Verify `D:/Projetos/catalog-itens/frontend/package.json` has the correct content. Open and confirm the `dependencies` block contains all required packages. The file should look like this after the installs:

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "next": "15.x",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.0",
    "swr": "^2.3.0",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "15.x",
    "typescript": "^5.0.0"
  }
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(frontend): scaffold Next.js 15 app with React 19 and Tailwind CSS"
```

---

## Task 2 — Tailwind config with Barbie theme tokens

- [ ] Replace `D:/Projetos/catalog-itens/frontend/tailwind.config.ts` with:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        barbie: {
          'bg-light': '#fce4ec',
          'bg-soft': '#f8bbd0',
          accent: '#f48fb1',
          primary: '#ec407a',
          dark: '#c2185b',
          text: '#880e4f',
          'hot-pink': '#ff69b4',
          surface: '#fff5f8',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(194, 24, 91, 0.08)',
        fab: '0 4px 16px 0 rgba(194, 24, 91, 0.32)',
      },
      backgroundImage: {
        'barbie-gradient':
          'linear-gradient(135deg, #ec407a 0%, #c2185b 100%)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add tailwind.config.ts
git commit -m "feat(frontend): add Barbie theme tokens to Tailwind config"
```

---

## Task 3 — Root layout with Poppins font, global metadata, robots noindex, theme-color

- [ ] Replace `D:/Projetos/catalog-itens/frontend/src/app/layout.tsx` with:

```typescript
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Catalog Itens',
    template: '%s | Catalog Itens',
  },
  description: 'Catálogo pessoal de itens da casa organizados por cômodos e locais.',
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon-180.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#ec407a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="bg-barbie-bg-light font-poppins text-barbie-text antialiased">
        <div
          id="toast-root"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2"
        />
        {children}
      </body>
    </html>
  )
}
```

- [ ] Replace `D:/Projetos/catalog-itens/frontend/src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --font-poppins: 'Poppins', sans-serif;
}

/* iOS safe area padding for bottom nav */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Remove default list styles */
ul,
ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Focus ring consistent */
*:focus-visible {
  outline: 2px solid #ec407a;
  outline-offset: 2px;
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(frontend): root layout with Poppins font, metadata and theme-color"
```

---

## Task 4 — PWA manifest

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Catalog Itens',
    short_name: 'Catalog',
    description: 'Catálogo pessoal de itens da casa organizados por cômodos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fce4ec',
    theme_color: '#ec407a',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  }
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/manifest.ts
git commit -m "feat(frontend): add PWA manifest with Barbie theme-color"
```

---

## Task 5 — Utility files: cn.ts and highlight.ts

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/lib/utils/` and create `D:/Projetos/catalog-itens/frontend/src/lib/utils/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, resolving conflicts correctly.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/utils/highlight.ts`:

```typescript
/**
 * Splits a text string into segments, marking which parts match the query.
 * Used by SearchResults to wrap matching text in <mark> elements.
 */
export interface TextSegment {
  text: string
  isMatch: boolean
}

/**
 * Returns an array of text segments for rendering highlighted search results.
 * Case-insensitive. Returns a single non-match segment when query is empty.
 *
 * @example
 * highlightSegments('Hello World', 'world')
 * // => [{ text: 'Hello ', isMatch: false }, { text: 'World', isMatch: true }]
 */
export function highlightSegments(text: string, query: string): TextSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }]
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: regex.test(part),
    }))
}

/**
 * Returns a plain string with the matched portion wrapped in <mark> HTML tags.
 * Safe only when rendered via dangerouslySetInnerHTML — prefer highlightSegments
 * for React rendering.
 */
export function highlightHtml(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="bg-barbie-accent/30 text-barbie-text rounded px-0.5">$1</mark>')
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/lib/utils/cn.ts src/lib/utils/highlight.ts
git commit -m "feat(frontend): add cn and highlight utility functions"
```

---

## Task 6 — API client: client.ts and types.ts

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/lib/api/` and create `D:/Projetos/catalog-itens/frontend/src/lib/api/client.ts`:

```typescript
/**
 * Base API client for catalog-itens backend.
 *
 * - Server-side (RSC, Server Actions): uses API_URL (internal Docker network)
 * - Client-side: uses NEXT_PUBLIC_API_URL (proxied via Next.js route handler)
 * - Injects X-Request-Id for correlation logging
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly path?: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal Docker network URL
    return process.env.API_URL ?? 'http://localhost:8080'
  }
  // Client-side: use public URL (proxied through Next.js)
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface FetchOptions extends RequestInit {
  /** Additional query string params appended to the URL */
  params?: Record<string, string | number | boolean | undefined | null>
}

/**
 * Core fetch wrapper. Throws ApiError on non-2xx responses.
 */
export async function fetchApi<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchInit } = options

  let url = `${getBaseUrl()}${path}`

  if (params) {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.set(key, String(value))
      }
    }
    const queryString = qs.toString()
    if (queryString) {
      url = `${url}?${queryString}`
    }
  }

  const requestId = generateRequestId()

  const headers = new Headers(fetchInit.headers)
  headers.set('X-Request-Id', requestId)
  if (!headers.has('Content-Type') && !(fetchInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...fetchInit,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    let errorPath: string | undefined
    let errorRequestId: string | undefined

    try {
      const errorBody = (await response.json()) as {
        message?: string
        path?: string
        requestId?: string
      }
      errorMessage = errorBody.message ?? errorMessage
      errorPath = errorBody.path
      errorRequestId = errorBody.requestId
    } catch {
      // response body was not JSON — use default message
    }

    throw new ApiError(response.status, errorMessage, errorPath, errorRequestId)
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/types.ts`:

```typescript
/**
 * TypeScript interfaces matching the Spring Boot backend DTOs.
 * All dates are ISO 8601 strings (TIMESTAMPTZ serialized by Jackson).
 * All IDs are UUID v7 strings.
 */

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PageInfo {
  number: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Page<T> {
  content: T[]
  page: PageInfo
}

// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------

export interface RoomSummary {
  id: string
  name: string
  description: string | null
  locationCount: number
  productCount: number
  photos: PhotoResponse[]
  createdAt: string
  updatedAt: string
}

export interface RoomDetail extends RoomSummary {
  locations: LocationSummary[]
}

export interface CreateRoomRequest {
  name: string
  description?: string | null
}

export interface UpdateRoomRequest {
  name: string
  description?: string | null
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export interface LocationSummary {
  id: string
  roomId: string
  roomName: string
  name: string
  description: string | null
  productCount: number
  photos: PhotoResponse[]
  createdAt: string
  updatedAt: string
}

export interface LocationDetail extends LocationSummary {
  products: ProductInLocationResponse[]
}

export interface ProductInLocationResponse {
  id: string
  name: string
  description: string | null
  quantity: number
  photos: PhotoResponse[]
  tags: TagResponse[]
}

export interface CreateLocationRequest {
  roomId: string
  name: string
  description?: string | null
}

export interface UpdateLocationRequest {
  name: string
  description?: string | null
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export interface ProductSummary {
  id: string
  name: string
  description: string | null
  photos: PhotoResponse[]
  tags: TagResponse[]
  locationCount: number
  totalQuantity: number
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends ProductSummary {
  locations: ProductLocationResponse[]
}

export interface ProductLocationResponse {
  locationId: string
  locationName: string
  roomId: string
  roomName: string
  quantity: number
}

export interface CreateProductRequest {
  name: string
  description?: string | null
  tagIds?: string[]
  locations?: Array<{ locationId: string; quantity: number }>
}

export interface UpdateProductRequest {
  name: string
  description?: string | null
  tagIds?: string[]
  locations?: Array<{ locationId: string; quantity: number }>
}

export interface ProductSearchParams {
  q?: string
  roomId?: string
  tagId?: string
  page?: number
  size?: number
}

// ---------------------------------------------------------------------------
// ProductLocation (sub-resource)
// ---------------------------------------------------------------------------

export interface AddProductLocationRequest {
  locationId: string
  quantity: number
}

export interface UpdateProductLocationRequest {
  quantity: number
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

export interface TagResponse {
  id: string
  name: string
  color: string | null
  createdAt: string
}

export interface CreateTagRequest {
  name: string
  color?: string | null
}

export interface UpdateTagRequest {
  name: string
  color?: string | null
}

// ---------------------------------------------------------------------------
// Photo
// ---------------------------------------------------------------------------

export type EntityType = 'product' | 'location' | 'room'

export interface PhotoResponse {
  id: string
  entityType: EntityType
  entityId: string
  url: string
  thumbnailUrl: string
  originalFilename: string
  contentType: string
  fileSize: number
  sortOrder: number
  createdAt: string
}

export interface ReorderPhotosRequest {
  photos: Array<{ photoId: string; sortOrder: number }>
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/lib/api/client.ts src/lib/api/types.ts
git commit -m "feat(frontend): add base API client with error handling and TypeScript DTOs"
```

---

## Task 7 — API modules: rooms, locations, products, tags, photos

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/rooms.ts`:

```typescript
import { fetchApi } from './client'
import type {
  RoomSummary,
  RoomDetail,
  CreateRoomRequest,
  UpdateRoomRequest,
} from './types'

export async function getRooms(): Promise<RoomSummary[]> {
  return fetchApi<RoomSummary[]>('/api/rooms')
}

export async function getRoomById(id: string): Promise<RoomDetail> {
  return fetchApi<RoomDetail>(`/api/rooms/${id}`)
}

export async function createRoom(data: CreateRoomRequest): Promise<RoomDetail> {
  return fetchApi<RoomDetail>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateRoom(
  id: string,
  data: UpdateRoomRequest,
): Promise<RoomDetail> {
  return fetchApi<RoomDetail>(`/api/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteRoom(id: string): Promise<void> {
  return fetchApi<void>(`/api/rooms/${id}`, { method: 'DELETE' })
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/locations.ts`:

```typescript
import { fetchApi } from './client'
import type {
  LocationSummary,
  LocationDetail,
  CreateLocationRequest,
  UpdateLocationRequest,
} from './types'

export async function getLocations(roomId?: string): Promise<LocationSummary[]> {
  return fetchApi<LocationSummary[]>('/api/locations', {
    params: { roomId },
  })
}

export async function getLocationById(id: string): Promise<LocationDetail> {
  return fetchApi<LocationDetail>(`/api/locations/${id}`)
}

export async function createLocation(
  data: CreateLocationRequest,
): Promise<LocationDetail> {
  return fetchApi<LocationDetail>('/api/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLocation(
  id: string,
  data: UpdateLocationRequest,
): Promise<LocationDetail> {
  return fetchApi<LocationDetail>(`/api/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteLocation(id: string): Promise<void> {
  return fetchApi<void>(`/api/locations/${id}`, { method: 'DELETE' })
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/products.ts`:

```typescript
import { fetchApi } from './client'
import type {
  ProductSummary,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchParams,
  AddProductLocationRequest,
  UpdateProductLocationRequest,
  Page,
} from './types'

export async function getProducts(
  params: ProductSearchParams = {},
): Promise<Page<ProductSummary>> {
  return fetchApi<Page<ProductSummary>>('/api/products', { params })
}

export async function getProductById(id: string): Promise<ProductDetail> {
  return fetchApi<ProductDetail>(`/api/products/${id}`)
}

export async function createProduct(
  data: CreateProductRequest,
): Promise<ProductDetail> {
  return fetchApi<ProductDetail>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<ProductDetail> {
  return fetchApi<ProductDetail>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  return fetchApi<void>(`/api/products/${id}`, { method: 'DELETE' })
}

export async function addProductLocation(
  productId: string,
  data: AddProductLocationRequest,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProductLocation(
  productId: string,
  locationId: string,
  data: UpdateProductLocationRequest,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function removeProductLocation(
  productId: string,
  locationId: string,
): Promise<void> {
  return fetchApi<void>(`/api/products/${productId}/locations/${locationId}`, {
    method: 'DELETE',
  })
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/tags.ts`:

```typescript
import { fetchApi } from './client'
import type {
  TagResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from './types'

export async function getTags(): Promise<TagResponse[]> {
  return fetchApi<TagResponse[]>('/api/tags')
}

export async function createTag(data: CreateTagRequest): Promise<TagResponse> {
  return fetchApi<TagResponse>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTag(
  id: string,
  data: UpdateTagRequest,
): Promise<TagResponse> {
  return fetchApi<TagResponse>(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTag(id: string): Promise<void> {
  return fetchApi<void>(`/api/tags/${id}`, { method: 'DELETE' })
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/lib/api/photos.ts`:

```typescript
import { fetchApi } from './client'
import type { PhotoResponse, ReorderPhotosRequest, EntityType } from './types'

type UploadEntity = 'products' | 'locations' | 'rooms'

function entityPath(entityType: EntityType): UploadEntity {
  const map: Record<EntityType, UploadEntity> = {
    product: 'products',
    location: 'locations',
    room: 'rooms',
  }
  return map[entityType]
}

export async function uploadPhoto(
  entityType: EntityType,
  entityId: string,
  file: File,
): Promise<PhotoResponse> {
  const path = entityPath(entityType)
  const form = new FormData()
  form.append('file', file)

  return fetchApi<PhotoResponse>(`/api/${path}/${entityId}/photos`, {
    method: 'POST',
    body: form,
    // Do not set Content-Type — browser sets multipart boundary automatically
  })
}

export async function reorderPhotos(
  entityType: EntityType,
  entityId: string,
  data: ReorderPhotosRequest,
): Promise<void> {
  const path = entityPath(entityType)
  return fetchApi<void>(`/api/${path}/${entityId}/photos/reorder`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePhoto(photoId: string): Promise<void> {
  return fetchApi<void>(`/api/photos/${photoId}`, { method: 'DELETE' })
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/lib/api/rooms.ts src/lib/api/locations.ts src/lib/api/products.ts src/lib/api/tags.ts src/lib/api/photos.ts
git commit -m "feat(frontend): add API modules for all entities"
```

---

## Task 8 — UI primitives: Button, Card, Badge, Input, Spinner, Toast

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/ui/` and create `D:/Projetos/catalog-itens/frontend/src/components/ui/Button.tsx`:

```typescript
import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-barbie-gradient text-white hover:opacity-90 active:opacity-80 shadow-md',
  secondary:
    'bg-barbie-bg-soft text-barbie-dark border border-barbie-accent hover:bg-barbie-accent/30',
  ghost:
    'bg-transparent text-barbie-primary hover:bg-barbie-bg-soft active:bg-barbie-accent/20',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-poppins font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-barbie-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Card.tsx`:

```typescript
import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl bg-barbie-surface shadow-card',
        interactive &&
          'cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div {...props} className={cn('p-4', className)}>
      {children}
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Badge.tsx`:

```typescript
import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'primary' | 'dark' | 'custom'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  /** Hex color — used when variant is 'custom' */
  color?: string | null
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-barbie-bg-soft text-barbie-text',
  primary: 'bg-barbie-primary text-white',
  dark: 'bg-barbie-dark text-white',
  custom: '',
}

export function Badge({
  variant = 'default',
  color,
  className,
  style,
  children,
  ...props
}: BadgeProps) {
  const customStyle =
    variant === 'custom' && color
      ? {
          backgroundColor: `${color}33`, // 20% opacity
          color: color,
          borderColor: `${color}66`,
          ...style,
        }
      : style

  return (
    <span
      {...props}
      style={customStyle}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantClasses[variant],
        variant === 'custom' && 'border',
        variant !== 'custom' && 'border-transparent',
        className,
      )}
    >
      {children}
    </span>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Input.tsx`:

```typescript
'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${props.name ?? Math.random().toString(36).slice(2)}`
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-barbie-text"
          >
            {label}
          </label>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            [errorId, hintId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text placeholder:text-barbie-accent focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30 disabled:cursor-not-allowed disabled:bg-barbie-bg-soft',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
            className,
          )}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-barbie-text/60">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Textarea.tsx`:

```typescript
'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `textarea-${props.name ?? Math.random().toString(36).slice(2)}`
    const errorId = error ? `${inputId}-error` : undefined
    const hintId = hint ? `${inputId}-hint` : undefined

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-barbie-text"
          >
            {label}
          </label>
        )}
        <textarea
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            [errorId, hintId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full resize-none rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text placeholder:text-barbie-accent focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30 disabled:cursor-not-allowed disabled:bg-barbie-bg-soft',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
            className,
          )}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-barbie-text/60">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Spinner.tsx`:

```typescript
import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
}

export function Spinner({ size = 'md', className, label = 'Carregando...' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-barbie-bg-soft border-t-barbie-primary',
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/ui/Toast.tsx`:

```typescript
'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-barbie-bg-soft border-barbie-accent text-barbie-text',
}

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card text-sm font-medium',
        variantClasses[toast.variant],
      )}
    >
      <span aria-hidden="true" className="text-base font-bold">
        {variantIcons[toast.variant]}
      </span>
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="ml-auto opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

// Global toast state managed outside React tree
type ToastListener = (toasts: ToastMessage[]) => void
const listeners: Set<ToastListener> = new Set()
let toastQueue: ToastMessage[] = []

export function showToast(message: string, variant: ToastVariant = 'info'): void {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  toastQueue = [...toastQueue, { id, message, variant }]
  listeners.forEach((fn) => fn(toastQueue))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const listener: ToastListener = (updated) => setToasts([...updated])
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    listeners.forEach((fn) => fn(toastQueue))
  }, [])

  if (!mounted) return null

  const container = document.getElementById('toast-root')
  if (!container) return null

  return createPortal(
    <>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </>,
    container,
  )
}
```

- [ ] Create the index barrel file `D:/Projetos/catalog-itens/frontend/src/components/ui/index.ts`:

```typescript
export { Button } from './Button'
export { Card, CardBody } from './Card'
export { Badge } from './Badge'
export { Input } from './Input'
export { Textarea } from './Textarea'
export { Spinner } from './Spinner'
export { ToastContainer, showToast } from './Toast'
export type { ToastVariant, ToastMessage } from './Toast'
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/ui/
git commit -m "feat(frontend): add UI primitives with Barbie theme"
```

---

## Task 9 — Layout components: BottomNav, PageHeader, Breadcrumb, FAB

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/layout/` and create `D:/Projetos/catalog-itens/frontend/src/components/layout/BottomNav.tsx`:

```typescript
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// Server Component — no 'use client' needed.
// aria-current="page" is rendered based on pathname passed by the shell layout.

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M3 3h8l9 9a2 2 0 010 2.83l-5.17 5.17a2 2 0 01-2.83 0L3 11V3z"
      />
    </svg>
  )
}

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: <HomeIcon /> },
  { href: '/search', label: 'Buscar', icon: <SearchIcon /> },
  { href: '/tags', label: 'Tags', icon: <TagIcon /> },
]

interface BottomNavProps {
  activePath: string
}

export function BottomNav({ activePath }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-barbie-accent/30 bg-white/80 backdrop-blur-md pb-safe"
    >
      <ul className="flex items-stretch justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? activePath === '/'
              : activePath.startsWith(item.href)

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-barbie-primary'
                    : 'text-barbie-text/50 hover:text-barbie-dark',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-xl transition-colors',
                    isActive && 'bg-barbie-bg-soft',
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/layout/PageHeader.tsx`:

```typescript
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

export function PageHeader({
  title,
  backHref,
  backLabel = 'Voltar',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 border-b border-barbie-accent/20 bg-barbie-surface/95 px-4 py-3 backdrop-blur-sm',
        className,
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          aria-label={backLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-barbie-dark transition-colors hover:bg-barbie-bg-soft"
        >
          <BackArrowIcon />
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-bold text-barbie-text">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/layout/Breadcrumb.tsx`:

```typescript
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="px-4 py-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-barbie-accent" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="font-semibold text-barbie-text truncate max-w-[150px]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-barbie-primary hover:text-barbie-dark hover:underline truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/layout/FAB.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface FABProps {
  href: string
  label: string
  className?: string
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export function FAB({ href, label, className }: FABProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-barbie-gradient text-white shadow-fab transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-barbie-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <PlusIcon />
      <span className="sr-only">{label}</span>
    </Link>
  )
}
```

- [ ] Create the index barrel `D:/Projetos/catalog-itens/frontend/src/components/layout/index.ts`:

```typescript
export { BottomNav } from './BottomNav'
export { PageHeader } from './PageHeader'
export { Breadcrumb } from './Breadcrumb'
export { FAB } from './FAB'
export type { BreadcrumbItem } from './Breadcrumb'
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/layout/
git commit -m "feat(frontend): add layout components BottomNav, PageHeader, Breadcrumb, FAB"
```

---

## Task 10 — Shell layout: `(shell)/layout.tsx`

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/(shell)/` and create `D:/Projetos/catalog-itens/frontend/src/app/(shell)/layout.tsx`:

```typescript
import { headers } from 'next/headers'
import { BottomNav } from '@/components/layout/BottomNav'
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
      <main className="pb-20">{children}</main>
      <BottomNav activePath={pathname} />
      <ToastContainer />
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/middleware.ts` to inject the pathname header so the Server Component BottomNav knows which tab is active:

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.webmanifest, icon-*.png (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest|icon-).*)',
  ],
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/(shell)/layout.tsx src/middleware.ts
git commit -m "feat(frontend): shell layout with BottomNav and pathname injection middleware"
```

---

## Task 11 — Home page: `(shell)/page.tsx` with search bar and tabs

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/(shell)/page.tsx`:

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { getRooms } from '@/lib/api/rooms'
import { getProducts } from '@/lib/api/products'
import { RoomCard } from '@/components/rooms/RoomCard'
import { ProductCard } from '@/components/products/ProductCard'
import { Spinner } from '@/components/ui/Spinner'
import { FAB } from '@/components/layout/FAB'
import { HomeSearchBar } from '@/components/search/HomeSearchBar'

interface HomePageProps {
  searchParams: Promise<{ tab?: string }>
}

export const metadata = {
  title: 'Início',
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
          {activeTab === 'rooms' ? (
            <RoomsTab />
          ) : (
            <ProductsTab />
          )}
        </Suspense>
      </div>

      <FAB
        href={activeTab === 'rooms' ? '/rooms/new' : '/products/new'}
        label={activeTab === 'rooms' ? 'Adicionar cômodo' : 'Adicionar produto'}
      />
    </div>
  )
}

async function RoomsTab() {
  const rooms = await getRooms()

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-5xl" aria-hidden="true">🏠</span>
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
        <span className="text-5xl" aria-hidden="true">📦</span>
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
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/search/HomeSearchBar.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function HomeSearchBar() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/search')
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search">
      <label htmlFor="home-search" className="sr-only">
        Buscar itens
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-barbie-accent"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="home-search"
          type="search"
          placeholder="Buscar produtos, cômodos..."
          autoComplete="off"
          className="w-full rounded-xl border border-white/30 bg-white/20 py-2.5 pl-10 pr-4 text-white placeholder:text-white/70 focus:border-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>
    </form>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/(shell)/page.tsx src/components/search/HomeSearchBar.tsx
git commit -m "feat(frontend): home page with tabs and search bar"
```

---

## Task 12 — RoomCard component and rooms/new page

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/rooms/` and create `D:/Projetos/catalog-itens/frontend/src/components/rooms/RoomCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import type { RoomSummary } from '@/lib/api/types'

interface RoomCardProps {
  room: RoomSummary
}

function RoomIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="text-barbie-dark"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

export function RoomCard({ room }: RoomCardProps) {
  const thumbnail = room.photos[0]

  return (
    <Link href={`/rooms/${room.id}`} className="block focus-visible:rounded-2xl">
      <Card interactive className="overflow-hidden">
        {thumbnail ? (
          <div className="relative h-32 w-full">
            <Image
              src={thumbnail.thumbnailUrl}
              alt={`Foto de ${room.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-barbie-bg-soft">
            <RoomIcon />
          </div>
        )}
        <CardBody>
          <h2 className="truncate font-bold text-barbie-text">{room.name}</h2>
          {room.description && (
            <p className="mt-0.5 truncate text-sm text-barbie-text/60">
              {room.description}
            </p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-barbie-dark">
            <span>{room.locationCount} local{room.locationCount !== 1 ? 'is' : ''}</span>
            <span>{room.productCount} item{room.productCount !== 1 ? 's' : ''}</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/rooms/new/page.tsx` (stub — full form implementation in Task 20):

```typescript
import { PageHeader } from '@/components/layout/PageHeader'
import { RoomForm } from '@/components/rooms/RoomForm'

export const metadata = {
  title: 'Novo Cômodo',
}

export default function NewRoomPage() {
  return (
    <div>
      <PageHeader title="Novo Cômodo" backHref="/" backLabel="Voltar para início" />
      <div className="px-4 py-6">
        <RoomForm />
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/rooms/RoomForm.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createRoom, updateRoom } from '@/lib/api/rooms'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import type { RoomSummary, CreateRoomRequest } from '@/lib/api/types'

interface RoomFormData {
  name: string
  description: string
}

interface RoomFormProps {
  room?: RoomSummary
}

export function RoomForm({ room }: RoomFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!room

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>({
    defaultValues: {
      name: room?.name ?? '',
      description: room?.description ?? '',
    },
  })

  async function onSubmit(data: RoomFormData) {
    setSubmitting(true)
    try {
      const payload: CreateRoomRequest = {
        name: data.name.trim(),
        description: data.description.trim() || null,
      }
      if (isEditing) {
        await updateRoom(room.id, payload)
        showToast('Cômodo atualizado com sucesso!', 'success')
        router.push(`/rooms/${room.id}`)
      } else {
        const created = await createRoom(payload)
        showToast('Cômodo criado com sucesso!', 'success')
        router.push(`/rooms/${created.id}`)
      }
    } catch {
      showToast('Erro ao salvar cômodo. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input
        label="Nome"
        placeholder="ex: Sala de estar"
        error={errors.name?.message}
        {...register('name', {
          required: 'Nome é obrigatório',
          maxLength: { value: 100, message: 'Máximo 100 caracteres' },
        })}
      />
      <Textarea
        label="Descrição (opcional)"
        placeholder="ex: Inclui sofá, estante e TV"
        rows={3}
        {...register('description', {
          maxLength: { value: 500, message: 'Máximo 500 caracteres' },
        })}
      />
      <Button type="submit" loading={submitting} fullWidth>
        {isEditing ? 'Salvar alterações' : 'Criar cômodo'}
      </Button>
    </form>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/rooms/ src/app/rooms/
git commit -m "feat(frontend): RoomCard component and room create/edit form"
```

---

## Task 13 — Room detail page: `/rooms/[id]/page.tsx` with loading, not-found, location list

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/rooms/[id]/` and create `D:/Projetos/catalog-itens/frontend/src/app/rooms/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getRoomById } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { FAB } from '@/components/layout/FAB'
import { LocationCard } from '@/components/locations/LocationCard'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface RoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const room = await getRoomById(id)
    return { title: room.name }
  } catch {
    return { title: 'Cômodo' }
  }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params

  let room
  try {
    room = await getRoomById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const coverPhoto = room.photos[0]

  return (
    <div>
      <PageHeader
        title={room.name}
        backHref="/"
        backLabel="Voltar para início"
        actions={
          <Link
            href={`/rooms/${room.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      {coverPhoto && (
        <div className="relative h-48 w-full">
          <Image
            src={coverPhoto.url}
            alt={`Foto de ${room.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="px-4 py-4">
        {room.description && (
          <p className="mb-4 text-sm text-barbie-text/70">{room.description}</p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-barbie-text">
            Locais ({room.locations.length})
          </h2>
        </div>

        {room.locations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">📍</span>
            <p className="text-sm text-barbie-text/60">
              Nenhum local neste cômodo ainda.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {room.locations.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <FAB
        href={`/locations/new?roomId=${room.id}`}
        label="Adicionar local"
      />
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/rooms/[id]/loading.tsx`:

```typescript
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
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/rooms/[id]/not-found.tsx`:

```typescript
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export default function RoomNotFound() {
  return (
    <div>
      <PageHeader title="Cômodo não encontrado" backHref="/" />
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden="true">🏠</span>
        <h2 className="text-xl font-bold text-barbie-text">
          Cômodo não encontrado
        </h2>
        <p className="text-sm text-barbie-text/60">
          Este cômodo não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-barbie-gradient px-6 py-2.5 font-semibold text-white shadow-md"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/rooms/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getRoomById } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { RoomForm } from '@/components/rooms/RoomForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface EditRoomPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditRoomPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const room = await getRoomById(id)
    return { title: `Editar ${room.name}` }
  } catch {
    return { title: 'Editar Cômodo' }
  }
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { id } = await params

  let room
  try {
    room = await getRoomById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  return (
    <div>
      <PageHeader
        title="Editar Cômodo"
        backHref={`/rooms/${room.id}`}
        backLabel={`Voltar para ${room.name}`}
      />
      <div className="px-4 py-6">
        <RoomForm room={room} />
      </div>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/rooms/
git commit -m "feat(frontend): room detail, loading, not-found and edit pages"
```

---

## Task 14 — LocationCard and Location detail page

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/locations/` and create `D:/Projetos/catalog-itens/frontend/src/components/locations/LocationCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import type { LocationSummary } from '@/lib/api/types'

interface LocationCardProps {
  location: LocationSummary
}

function LocationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="text-barbie-dark"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

export function LocationCard({ location }: LocationCardProps) {
  const thumbnail = location.photos[0]

  return (
    <Link href={`/locations/${location.id}`} className="block focus-visible:rounded-2xl">
      <Card interactive>
        <div className="flex items-center gap-3 p-3">
          {thumbnail ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={thumbnail.thumbnailUrl}
                alt={`Foto de ${location.name}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-barbie-bg-soft">
              <LocationIcon />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-barbie-text">{location.name}</h3>
            {location.description && (
              <p className="truncate text-sm text-barbie-text/60">{location.description}</p>
            )}
            <p className="mt-1 text-xs text-barbie-dark">
              {location.productCount} item{location.productCount !== 1 ? 's' : ''}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className="shrink-0 text-barbie-accent"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  )
}
```

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/locations/[id]/` and create `D:/Projetos/catalog-itens/frontend/src/app/locations/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getLocationById } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { FAB } from '@/components/layout/FAB'
import { ProductCard } from '@/components/products/ProductCard'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface LocationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const loc = await getLocationById(id)
    return { title: loc.name }
  } catch {
    return { title: 'Local' }
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { id } = await params

  let location
  try {
    location = await getLocationById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const coverPhoto = location.photos[0]

  return (
    <div>
      <PageHeader
        title={location.name}
        backHref={`/rooms/${location.roomId}`}
        backLabel={`Voltar para ${location.roomName}`}
        actions={
          <Link
            href={`/locations/${location.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      <Breadcrumb
        items={[
          { label: 'Início', href: '/' },
          { label: location.roomName, href: `/rooms/${location.roomId}` },
          { label: location.name },
        ]}
      />

      {coverPhoto && (
        <div className="relative h-40 w-full">
          <Image
            src={coverPhoto.url}
            alt={`Foto de ${location.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="px-4 py-4">
        {location.description && (
          <p className="mb-4 text-sm text-barbie-text/70">{location.description}</p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-barbie-text">
            Produtos ({location.products.length})
          </h2>
        </div>

        {location.products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">📦</span>
            <p className="text-sm text-barbie-text/60">
              Nenhum produto neste local ainda.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {location.products.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={{
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    photos: product.photos,
                    tags: product.tags,
                    locationCount: 1,
                    totalQuantity: product.quantity,
                    createdAt: '',
                    updatedAt: '',
                  }}
                  quantityBadge={product.quantity}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <FAB
        href={`/products/new?locationId=${location.id}`}
        label="Adicionar produto neste local"
      />
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/locations/[id]/loading.tsx`:

```typescript
import { PageHeader } from '@/components/layout/PageHeader'

export default function LocationLoading() {
  return (
    <div>
      <PageHeader title="Carregando..." backHref="/" />
      <div className="animate-pulse px-4 py-4">
        <div className="mb-4 h-6 w-48 rounded-lg bg-barbie-bg-soft" />
        <div className="mb-4 h-40 rounded-2xl bg-barbie-bg-soft" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-barbie-bg-soft" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/locations/[id]/not-found.tsx`:

```typescript
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export default function LocationNotFound() {
  return (
    <div>
      <PageHeader title="Local não encontrado" backHref="/" />
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden="true">📍</span>
        <h2 className="text-xl font-bold text-barbie-text">
          Local não encontrado
        </h2>
        <p className="text-sm text-barbie-text/60">
          Este local não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-barbie-gradient px-6 py-2.5 font-semibold text-white shadow-md"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/locations/new/page.tsx`:

```typescript
import { getLocations } from '@/lib/api/locations'
import { getRooms } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationForm } from '@/components/locations/LocationForm'

interface NewLocationPageProps {
  searchParams: Promise<{ roomId?: string }>
}

export const metadata = { title: 'Novo Local' }

export default async function NewLocationPage({ searchParams }: NewLocationPageProps) {
  const { roomId } = await searchParams
  const rooms = await getRooms()

  return (
    <div>
      <PageHeader
        title="Novo Local"
        backHref={roomId ? `/rooms/${roomId}` : '/'}
        backLabel="Voltar"
      />
      <div className="px-4 py-6">
        <LocationForm rooms={rooms} defaultRoomId={roomId} />
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/locations/LocationForm.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { createLocation, updateLocation } from '@/lib/api/locations'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import type { LocationSummary, RoomSummary } from '@/lib/api/types'

interface LocationFormData {
  roomId: string
  name: string
  description: string
}

interface LocationFormProps {
  location?: LocationSummary
  rooms: RoomSummary[]
  defaultRoomId?: string
}

export function LocationForm({ location, rooms, defaultRoomId }: LocationFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!location

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormData>({
    defaultValues: {
      roomId: location?.roomId ?? defaultRoomId ?? '',
      name: location?.name ?? '',
      description: location?.description ?? '',
    },
  })

  async function onSubmit(data: LocationFormData) {
    setSubmitting(true)
    try {
      if (isEditing) {
        await updateLocation(location.id, {
          name: data.name.trim(),
          description: data.description.trim() || null,
        })
        showToast('Local atualizado com sucesso!', 'success')
        router.push(`/locations/${location.id}`)
      } else {
        const created = await createLocation({
          roomId: data.roomId,
          name: data.name.trim(),
          description: data.description.trim() || null,
        })
        showToast('Local criado com sucesso!', 'success')
        router.push(`/locations/${created.id}`)
      }
    } catch {
      showToast('Erro ao salvar local. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {!isEditing && (
        <div className="flex flex-col gap-1">
          <label htmlFor="roomId" className="text-sm font-semibold text-barbie-text">
            Cômodo
          </label>
          <select
            id="roomId"
            className="w-full rounded-xl border border-barbie-accent bg-white px-4 py-2.5 text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            {...register('roomId', { required: 'Selecione um cômodo' })}
          >
            <option value="">Selecione um cômodo...</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          {errors.roomId && (
            <p role="alert" className="text-xs text-red-600">
              {errors.roomId.message}
            </p>
          )}
        </div>
      )}

      <Input
        label="Nome"
        placeholder="ex: Guarda-roupa superior"
        error={errors.name?.message}
        {...register('name', {
          required: 'Nome é obrigatório',
          maxLength: { value: 100, message: 'Máximo 100 caracteres' },
        })}
      />

      <Textarea
        label="Descrição (opcional)"
        placeholder="ex: Prateleira de cima, lado direito"
        rows={3}
        {...register('description', {
          maxLength: { value: 500, message: 'Máximo 500 caracteres' },
        })}
      />

      <Button type="submit" loading={submitting} fullWidth>
        {isEditing ? 'Salvar alterações' : 'Criar local'}
      </Button>
    </form>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/locations/ src/app/locations/
git commit -m "feat(frontend): LocationCard, location detail, create and edit pages"
```

---

## Task 15 — ProductCard and ProductGrid components

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/products/` and create `D:/Projetos/catalog-itens/frontend/src/components/products/ProductCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ProductSummary } from '@/lib/api/types'

interface ProductCardProps {
  product: ProductSummary
  /** Optional badge showing quantity in a specific location */
  quantityBadge?: number
  /** Highlight query for search results — not used in this component */
  searchQuery?: string
}

export function ProductCard({ product, quantityBadge }: ProductCardProps) {
  const thumbnail = product.photos[0]
  const primaryTag = product.tags[0]

  return (
    <Link href={`/products/${product.id}`} className="block focus-visible:rounded-2xl">
      <Card interactive className="overflow-hidden">
        {thumbnail ? (
          <div className="relative h-40 w-full">
            <Image
              src={thumbnail.thumbnailUrl}
              alt={`Foto de ${product.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
            {quantityBadge !== undefined && (
              <span className="absolute right-2 top-2 rounded-lg bg-barbie-dark px-2 py-0.5 text-xs font-bold text-white shadow">
                x{quantityBadge}
              </span>
            )}
          </div>
        ) : (
          <div className="relative flex h-40 items-center justify-center bg-barbie-bg-soft">
            <span className="text-4xl" aria-hidden="true">📦</span>
            {quantityBadge !== undefined && (
              <span className="absolute right-2 top-2 rounded-lg bg-barbie-dark px-2 py-0.5 text-xs font-bold text-white shadow">
                x{quantityBadge}
              </span>
            )}
          </div>
        )}
        <CardBody className="pt-3">
          <h3 className="truncate font-bold text-barbie-text leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-barbie-text/60">
              {product.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {primaryTag && (
              <Badge variant="custom" color={primaryTag.color}>
                {primaryTag.name}
              </Badge>
            )}
            {product.tags.length > 1 && (
              <Badge variant="default">+{product.tags.length - 1}</Badge>
            )}
            {product.locationCount > 0 && (
              <span className="ml-auto text-xs text-barbie-dark font-medium">
                {product.totalQuantity} un.
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/products/ProductGrid.tsx`:

```typescript
import { ProductCard } from './ProductCard'
import type { ProductSummary } from '@/lib/api/types'

interface ProductGridProps {
  products: ProductSummary[]
  emptyMessage?: string
}

export function ProductGrid({ products, emptyMessage = 'Nenhum produto encontrado.' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl" aria-hidden="true">📦</span>
        <p className="text-sm text-barbie-text/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/products/ProductCard.tsx src/components/products/ProductGrid.tsx
git commit -m "feat(frontend): ProductCard and ProductGrid components"
```

---

## Task 16 — Product detail page

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/products/[id]/` and create `D:/Projetos/catalog-itens/frontend/src/app/products/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductById } from '@/lib/api/products'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { PhotoCarousel } from '@/components/photos/PhotoCarousel'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProductById(id)
    return {
      title: product.name,
      description: product.description ?? undefined,
    }
  } catch {
    return { title: 'Produto' }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params

  let product
  try {
    product = await getProductById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        backHref="/?tab=products"
        backLabel="Voltar para produtos"
        actions={
          <Link
            href={`/products/${product.id}/edit`}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-barbie-primary hover:bg-barbie-bg-soft"
          >
            Editar
          </Link>
        }
      />

      {product.photos.length > 0 && (
        <PhotoCarousel
          photos={product.photos}
          productName={product.name}
        />
      )}

      <div className="px-4 py-4 flex flex-col gap-5">
        {product.description && (
          <p className="text-sm leading-relaxed text-barbie-text/80">
            {product.description}
          </p>
        )}

        {product.tags.length > 0 && (
          <section aria-label="Tags do produto">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag.id} variant="custom" color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {product.locations.length > 0 && (
          <section aria-label="Locais de armazenamento">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-barbie-text/50">
              Armazenado em
            </h2>
            <ul className="flex flex-col gap-2">
              {product.locations.map((loc) => (
                <li key={loc.locationId}>
                  <Link
                    href={`/locations/${loc.locationId}`}
                    className="flex items-center justify-between rounded-xl border border-barbie-accent/30 bg-barbie-surface px-3 py-2.5 hover:bg-barbie-bg-soft transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-barbie-text">
                        {loc.locationName}
                      </span>
                      <span className="text-xs text-barbie-text/50">
                        {loc.roomName}
                      </span>
                    </div>
                    <Badge variant="dark" className="shrink-0 ml-2">
                      x{loc.quantity}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right text-sm font-semibold text-barbie-dark">
              Total: {product.totalQuantity} unidade{product.totalQuantity !== 1 ? 's' : ''}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/products/[id]/loading.tsx`:

```typescript
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
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/products/[id]/not-found.tsx`:

```typescript
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ProductNotFound() {
  return (
    <div>
      <PageHeader title="Produto não encontrado" backHref="/?tab=products" />
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-6xl" aria-hidden="true">📦</span>
        <h2 className="text-xl font-bold text-barbie-text">
          Produto não encontrado
        </h2>
        <p className="text-sm text-barbie-text/60">
          Este produto não existe ou foi removido.
        </p>
        <Link
          href="/?tab=products"
          className="rounded-xl bg-barbie-gradient px-6 py-2.5 font-semibold text-white shadow-md"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/products/[id]/
git commit -m "feat(frontend): product detail, loading, and not-found pages"
```

---

## Task 17 — PhotoCarousel component (Client Component)

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/photos/` and create `D:/Projetos/catalog-itens/frontend/src/components/photos/PhotoCarousel.tsx`:

```typescript
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import type { PhotoResponse } from '@/lib/api/types'

interface PhotoCarouselProps {
  photos: PhotoResponse[]
  productName: string
}

export function PhotoCarousel({ photos, productName }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const regionRef = useRef<HTMLDivElement>(null)

  const total = photos.length

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? total - 1 : c - 1))
  }, [total])

  const next = useCallback(() => {
    setCurrent((c) => (c === total - 1 ? 0 : c + 1))
  }, [total])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    const el = regionRef.current
    if (el) {
      el.addEventListener('keydown', handleKey)
      return () => el.removeEventListener('keydown', handleKey)
    }
  }, [prev, next])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) prev()
    else if (delta < -50) next()
    touchStartX.current = null
  }

  if (total === 0) return null

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Fotos do produto"
      aria-roledescription="carousel"
      tabIndex={0}
      className="relative select-none overflow-hidden outline-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative h-72 bg-barbie-bg-soft">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            aria-label={`Foto ${index + 1} de ${total} de ${productName}`}
            aria-roledescription="slide"
            aria-hidden={index !== current}
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              index === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <Image
              src={photo.url}
              alt={`${productName} — foto ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Prev / Next buttons — only if more than 1 photo */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-barbie-dark shadow backdrop-blur-sm transition-colors hover:bg-white active:bg-barbie-bg-soft"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-barbie-dark shadow backdrop-blur-sm transition-colors hover:bg-white active:bg-barbie-bg-soft"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {total > 1 && (
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2"
          role="tablist"
          aria-label="Indicador de fotos"
        >
          {photos.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === current}
              aria-label={`Foto ${index + 1} de ${total}`}
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                index === current
                  ? 'w-6 bg-barbie-primary'
                  : 'w-2 bg-white/70 hover:bg-white',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/photos/PhotoCarousel.tsx
git commit -m "feat(frontend): PhotoCarousel with swipe, keyboard nav and aria support"
```

---

## Task 18 — PhotoUploadZone component

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/photos/PhotoUploadZone.tsx`:

```typescript
'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

const MAX_PHOTOS = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export interface PhotoSlot {
  /** Local file object — null if slot is empty */
  file: File | null
  /** Existing photo URL (already uploaded) — null for new files */
  existingUrl: string | null
  /** Existing photo ID — null for new files */
  existingId: string | null
  /** Upload progress 0-100 — null means not uploading */
  progress: number | null
}

interface PhotoUploadZoneProps {
  slots: PhotoSlot[]
  onChange: (slots: PhotoSlot[]) => void
  error?: string
}

function EmptySlotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="text-barbie-accent"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16m8-8H4"
      />
    </svg>
  )
}

export function PhotoUploadZone({ slots, onChange, error }: PhotoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const activeSlots = slots.filter((s) => s.file !== null || s.existingId !== null)
  const hasRoom = activeSlots.length < MAX_PHOTOS

  function validateFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return `Tipo não suportado: ${file.type}. Use JPEG, PNG ou WebP.`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 5MB.`
    }
    return null
  }

  const addFiles = useCallback(
    (files: File[]) => {
      setValidationError(null)
      const newSlots = [...slots]
      const emptyIndices = newSlots
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.file === null && s.existingId === null)
        .map(({ i }) => i)

      let added = 0
      for (const file of files) {
        if (emptyIndices.length === 0 || added >= emptyIndices.length) {
          setValidationError(`Máximo de ${MAX_PHOTOS} fotos atingido.`)
          break
        }
        const err = validateFile(file)
        if (err) {
          setValidationError(err)
          break
        }
        const idx = emptyIndices[added]
        newSlots[idx] = { file, existingUrl: null, existingId: null, progress: null }
        added++
      }

      if (added > 0) onChange(newSlots)
    },
    [slots, onChange],
  )

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    addFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    setDragOverSlot(null)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function removeSlot(index: number) {
    const newSlots = [...slots]
    newSlots[index] = { file: null, existingUrl: null, existingId: null, progress: null }
    onChange(newSlots)
  }

  function handleSlotDragStart(e: React.DragEvent, fromIndex: number) {
    e.dataTransfer.setData('text/plain', String(fromIndex))
  }

  function handleSlotDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIndex === toIndex) return
    const newSlots = [...slots]
    const temp = newSlots[fromIndex]
    newSlots[fromIndex] = newSlots[toIndex]
    newSlots[toIndex] = temp
    onChange(newSlots)
    setDragOverSlot(null)
  }

  const displayError = error ?? validationError

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-barbie-text">
        Fotos (máx. {MAX_PHOTOS})
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Área para upload de fotos. Clique ou arraste arquivos aqui."
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => hasRoom && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasRoom) {
            fileInputRef.current?.click()
          }
        }}
        className={cn(
          'grid grid-cols-3 gap-3 rounded-2xl border-2 border-dashed p-3 transition-colors',
          dragging
            ? 'border-barbie-primary bg-barbie-bg-soft'
            : 'border-barbie-accent bg-barbie-surface hover:border-barbie-primary',
          !hasRoom && 'cursor-default opacity-80',
          displayError && 'border-red-400',
        )}
      >
        {slots.map((slot, index) => {
          const isEmpty = slot.file === null && slot.existingId === null
          const previewUrl = slot.existingUrl ?? (slot.file ? URL.createObjectURL(slot.file) : null)

          return (
            <div
              key={index}
              draggable={!isEmpty}
              onDragStart={(e) => !isEmpty && handleSlotDragStart(e, index)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverSlot(index)
              }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={(e) => !isEmpty && handleSlotDrop(e, index)}
              aria-label={
                isEmpty
                  ? `Slot ${index + 1} de foto — vazio`
                  : `Slot ${index + 1} de foto — ${slot.file?.name ?? 'foto existente'}. Arraste para reordenar.`
              }
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border',
                isEmpty
                  ? 'border-barbie-accent/50 bg-barbie-bg-soft flex items-center justify-center'
                  : 'border-barbie-accent cursor-grab active:cursor-grabbing',
                dragOverSlot === index && !isEmpty && 'ring-2 ring-barbie-primary',
              )}
            >
              {isEmpty ? (
                <EmptySlotIcon />
              ) : (
                <>
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt={`Preview foto ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 30vw, 120px"
                      className="object-cover"
                      unoptimized={!!slot.file} // local blob URLs skip Next.js optimization
                    />
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSlot(index)
                    }}
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                  >
                    ✕
                  </button>

                  {/* Progress bar */}
                  {slot.progress !== null && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/30 px-1 py-0.5">
                      <div
                        role="progressbar"
                        aria-valuenow={slot.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Upload da foto ${index + 1}: ${slot.progress}%`}
                        style={{ width: `${slot.progress}%` }}
                        className="h-1.5 rounded-full bg-barbie-primary transition-all duration-300"
                      />
                    </div>
                  )}

                  {/* Drag handle indicator */}
                  <div className="absolute left-1 top-1 opacity-60" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <circle cx="9" cy="6" r="2" />
                      <circle cx="9" cy="12" r="2" />
                      <circle cx="9" cy="18" r="2" />
                      <circle cx="15" cy="6" r="2" />
                      <circle cx="15" cy="12" r="2" />
                      <circle cx="15" cy="18" r="2" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileInputChange}
      />

      {displayError && (
        <p role="alert" className="text-xs text-red-600">
          {displayError}
        </p>
      )}

      <p className="text-xs text-barbie-text/50">
        JPEG, PNG ou WebP. Máximo 5MB por foto. Arraste para reordenar.
      </p>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/photos/PhotoUploadZone.tsx
git commit -m "feat(frontend): PhotoUploadZone with drop zone, preview slots, drag reorder and progress"
```

---

## Task 19 — TagPicker component

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/components/tags/` and create `D:/Projetos/catalog-itens/frontend/src/components/tags/TagPicker.tsx`:

```typescript
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import type { TagResponse } from '@/lib/api/types'

interface TagPickerProps {
  /** All available tags from the API */
  allTags: TagResponse[]
  /** Currently selected tag IDs */
  selectedIds: string[]
  onChange: (ids: string[]) => void
  /** Called when the user types a name that doesn't match any existing tag */
  onCreateTag?: (name: string) => Promise<TagResponse>
  label?: string
  error?: string
}

export function TagPicker({
  allTags,
  selectedIds,
  onChange,
  onCreateTag,
  label = 'Tags',
  error,
}: TagPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredTags = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) &&
      !selectedIds.includes(t.id),
  )

  const exactMatch = allTags.find(
    (t) => t.name.toLowerCase() === query.toLowerCase(),
  )

  const showCreateOption =
    query.trim().length > 0 &&
    !exactMatch &&
    onCreateTag !== undefined

  function toggleTag(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
      setQuery('')
      inputRef.current?.focus()
    }
  }

  async function handleCreate() {
    if (!onCreateTag || !query.trim()) return
    setCreating(true)
    try {
      const newTag = await onCreateTag(query.trim())
      onChange([...selectedIds, newTag.id])
      setQuery('')
    } finally {
      setCreating(false)
      setOpen(false)
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredTags.length === 1) {
          toggleTag(filteredTags[0].id)
        } else if (showCreateOption) {
          handleCreate()
        }
      }
      if (e.key === 'Backspace' && query === '' && selectedIds.length > 0) {
        onChange(selectedIds.slice(0, -1))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredTags, query, selectedIds, showCreateOption],
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id))

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-barbie-text">{label}</label>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-1.5 rounded-xl border border-barbie-accent bg-white p-2 focus-within:border-barbie-primary focus-within:ring-2 focus-within:ring-barbie-primary/30',
          error && 'border-red-400 focus-within:border-red-500 focus-within:ring-red-200',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: tag.color ? `${tag.color}33` : undefined,
              color: tag.color ?? '#880e4f',
              borderColor: tag.color ? `${tag.color}66` : '#f48fb1',
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleTag(tag.id)
              }}
              aria-label={`Remover tag ${tag.name}`}
              className="ml-0.5 opacity-60 hover:opacity-100 text-inherit"
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length === 0 ? 'Buscar ou criar tag...' : ''}
          aria-label="Buscar tags"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="min-w-[120px] flex-1 bg-transparent text-sm text-barbie-text outline-none placeholder:text-barbie-accent/70"
        />
      </div>

      {open && (filteredTags.length > 0 || showCreateOption) && (
        <ul
          role="listbox"
          aria-label="Sugestões de tags"
          className="z-50 max-h-48 overflow-y-auto rounded-xl border border-barbie-accent/50 bg-white shadow-card"
        >
          {filteredTags.map((tag) => (
            <li key={tag.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-barbie-bg-soft"
              >
                {tag.color && (
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: tag.color, borderColor: tag.color }}
                    aria-hidden="true"
                  />
                )}
                {tag.name}
              </button>
            </li>
          ))}

          {showCreateOption && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 border-t border-barbie-accent/20 px-3 py-2 text-sm font-medium text-barbie-primary hover:bg-barbie-bg-soft disabled:opacity-50"
              >
                {creating ? (
                  <span className="text-barbie-text/50">Criando...</span>
                ) : (
                  <>
                    <span aria-hidden="true">+</span>
                    Criar tag &ldquo;{query.trim()}&rdquo;
                  </>
                )}
              </button>
            </li>
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] Create the barrel `D:/Projetos/catalog-itens/frontend/src/components/tags/TagBadge.tsx`:

```typescript
import { Badge } from '@/components/ui/Badge'
import type { TagResponse } from '@/lib/api/types'

interface TagBadgeProps {
  tag: TagResponse
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Badge variant="custom" color={tag.color}>
      {tag.name}
    </Badge>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/tags/
git commit -m "feat(frontend): TagPicker with autocomplete and inline create, TagBadge"
```

---

## Task 20 — ProductForm component

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/products/ProductForm.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useState, useOptimistic, useTransition } from 'react'
import { createProduct, updateProduct } from '@/lib/api/products'
import { createTag } from '@/lib/api/tags'
import { uploadPhoto, deletePhoto, reorderPhotos } from '@/lib/api/photos'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { PhotoUploadZone, type PhotoSlot } from '@/components/photos/PhotoUploadZone'
import { TagPicker } from '@/components/tags/TagPicker'
import type {
  ProductDetail,
  TagResponse,
  LocationSummary,
  CreateProductRequest,
} from '@/lib/api/types'

interface ProductFormData {
  name: string
  description: string
}

interface LocationEntry {
  locationId: string
  locationName: string
  roomName: string
  quantity: number
}

interface ProductFormProps {
  product?: ProductDetail
  allTags: TagResponse[]
  allLocations: LocationSummary[]
  /** Pre-selected location ID from query param */
  defaultLocationId?: string
}

function createEmptySlots(): PhotoSlot[] {
  return [
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
    { file: null, existingUrl: null, existingId: null, progress: null },
  ]
}

export function ProductForm({
  product,
  allTags,
  allLocations,
  defaultLocationId,
}: ProductFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()
  const isEditing = !!product

  // Photo slots
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(() => {
    if (product?.photos) {
      const slots = createEmptySlots()
      product.photos.forEach((p, i) => {
        if (i < 3) {
          slots[i] = {
            file: null,
            existingUrl: p.url,
            existingId: p.id,
            progress: null,
          }
        }
      })
      return slots
    }
    return createEmptySlots()
  })

  // Tag selection
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    product?.tags.map((t) => t.id) ?? [],
  )
  const [localTags, setLocalTags] = useState<TagResponse[]>(allTags)

  // Location assignments
  const [locationEntries, setLocationEntries] = useOptimistic<LocationEntry[]>(
    () => {
      if (product?.locations) {
        return product.locations.map((l) => ({
          locationId: l.locationId,
          locationName: l.locationName,
          roomName: l.roomName,
          quantity: l.quantity,
        }))
      }
      if (defaultLocationId) {
        const loc = allLocations.find((l) => l.id === defaultLocationId)
        if (loc) {
          return [{ locationId: loc.id, locationName: loc.name, roomName: loc.roomName, quantity: 1 }]
        }
      }
      return []
    },
  )

  const [selectedLocationId, setSelectedLocationId] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
    },
  })

  async function handleCreateTag(name: string): Promise<TagResponse> {
    const newTag = await createTag({ name, color: null })
    setLocalTags((prev) => [...prev, newTag])
    return newTag
  }

  function addLocationEntry() {
    if (!selectedLocationId) return
    const loc = allLocations.find((l) => l.id === selectedLocationId)
    if (!loc) return
    if (locationEntries.some((e) => e.locationId === selectedLocationId)) return

    startTransition(() => {
      setLocationEntries((prev) => [
        ...prev,
        {
          locationId: loc.id,
          locationName: loc.name,
          roomName: loc.roomName,
          quantity: 1,
        },
      ])
    })
    setSelectedLocationId('')
  }

  function updateLocationQuantity(locationId: string, quantity: number) {
    startTransition(() => {
      setLocationEntries((prev) =>
        prev.map((e) => (e.locationId === locationId ? { ...e, quantity } : e)),
      )
    })
  }

  function removeLocationEntry(locationId: string) {
    startTransition(() => {
      setLocationEntries((prev) => prev.filter((e) => e.locationId !== locationId))
    })
  }

  async function onSubmit(data: ProductFormData) {
    setSubmitting(true)

    try {
      const payload: CreateProductRequest = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        tagIds: selectedTagIds,
        locations: locationEntries.map((e) => ({
          locationId: e.locationId,
          quantity: e.quantity,
        })),
      }

      let productId: string

      if (isEditing) {
        const updated = await updateProduct(product.id, payload)
        productId = updated.id
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }

      // Upload new photos sequentially, tracking progress per slot
      const newSlots = photoSlots.filter((s) => s.file !== null)
      for (let i = 0; i < photoSlots.length; i++) {
        const slot = photoSlots[i]
        if (slot.file === null) continue

        setPhotoSlots((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, progress: 0 } : s)),
        )

        // Simulate progress since fetch doesn't expose upload progress
        const interval = setInterval(() => {
          setPhotoSlots((prev) =>
            prev.map((s, idx) =>
              idx === i && s.progress !== null && s.progress < 90
                ? { ...s, progress: s.progress + 10 }
                : s,
            ),
          )
        }, 100)

        try {
          await uploadPhoto('product', productId, slot.file)
        } finally {
          clearInterval(interval)
          setPhotoSlots((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, progress: 100 } : s)),
          )
        }
      }

      showToast(
        isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!',
        'success',
      )
      router.push(`/products/${productId}`)
    } catch {
      showToast('Erro ao salvar produto. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const availableLocations = allLocations.filter(
    (l) => !locationEntries.some((e) => e.locationId === l.id),
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 pb-10">
      {/* Basic info */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Informações básicas
        </legend>
        <Input
          label="Nome"
          placeholder="ex: Furadeira Bosch"
          error={errors.name?.message}
          {...register('name', {
            required: 'Nome é obrigatório',
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />
        <Textarea
          label="Descrição (opcional)"
          placeholder="ex: Modelo GSB 13 RE, bivolt, com maleta"
          rows={3}
          {...register('description', {
            maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
          })}
        />
      </fieldset>

      {/* Photos */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Fotos
        </legend>
        <PhotoUploadZone slots={photoSlots} onChange={setPhotoSlots} />
      </fieldset>

      {/* Tags */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Tags
        </legend>
        <TagPicker
          allTags={localTags}
          selectedIds={selectedTagIds}
          onChange={setSelectedTagIds}
          onCreateTag={handleCreateTag}
          label=""
        />
      </fieldset>

      {/* Locations */}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Locais de armazenamento
        </legend>

        {locationEntries.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {locationEntries.map((entry) => (
              <li
                key={entry.locationId}
                className="flex items-center gap-3 rounded-xl border border-barbie-accent/30 bg-barbie-surface px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-barbie-text">
                    {entry.locationName}
                  </span>
                  <span className="text-xs text-barbie-text/50">{entry.roomName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`qty-${entry.locationId}`}
                    className="sr-only"
                  >
                    Quantidade em {entry.locationName}
                  </label>
                  <input
                    id={`qty-${entry.locationId}`}
                    type="number"
                    min={1}
                    max={99999}
                    value={entry.quantity}
                    onChange={(e) =>
                      updateLocationQuantity(
                        entry.locationId,
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-16 rounded-lg border border-barbie-accent bg-white px-2 py-1 text-center text-sm focus:border-barbie-primary focus:outline-none focus:ring-1 focus:ring-barbie-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeLocationEntry(entry.locationId)}
                    aria-label={`Remover ${entry.locationName}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-barbie-text/40 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {availableLocations.length > 0 && (
          <div className="flex gap-2">
            <label htmlFor="location-select" className="sr-only">
              Selecionar local
            </label>
            <select
              id="location-select"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="flex-1 rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
            >
              <option value="">Adicionar local...</option>
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.roomName} — {loc.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLocationEntry}
              disabled={!selectedLocationId}
            >
              Adicionar
            </Button>
          </div>
        )}
      </fieldset>

      <Button type="submit" loading={submitting} fullWidth size="lg">
        {isEditing ? 'Salvar alterações' : 'Criar produto'}
      </Button>
    </form>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/components/products/ProductForm.tsx
git commit -m "feat(frontend): ProductForm with photo upload, tag picker and location selector"
```

---

## Task 21 — Product create page

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/products/new/` and create `D:/Projetos/catalog-itens/frontend/src/app/products/new/page.tsx`:

```typescript
import { getTags } from '@/lib/api/tags'
import { getLocations } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/products/ProductForm'

interface NewProductPageProps {
  searchParams: Promise<{ locationId?: string }>
}

export const metadata = { title: 'Novo Produto' }

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { locationId } = await searchParams

  const [tags, locations] = await Promise.all([getTags(), getLocations()])

  return (
    <div>
      <PageHeader
        title="Novo Produto"
        backHref={locationId ? `/locations/${locationId}` : '/?tab=products'}
        backLabel="Voltar"
      />
      <div className="px-4 py-6">
        <ProductForm
          allTags={tags}
          allLocations={locations}
          defaultLocationId={locationId}
        />
      </div>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/products/new/
git commit -m "feat(frontend): product create page"
```

---

## Task 22 — Product edit page

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/products/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/api/products'
import { getTags } from '@/lib/api/tags'
import { getLocations } from '@/lib/api/locations'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/products/ProductForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await getProductById(id)
    return { title: `Editar ${product.name}` }
  } catch {
    return { title: 'Editar Produto' }
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  let product
  try {
    product = await getProductById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const [tags, locations] = await Promise.all([getTags(), getLocations()])

  return (
    <div>
      <PageHeader
        title="Editar Produto"
        backHref={`/products/${product.id}`}
        backLabel={`Voltar para ${product.name}`}
      />
      <div className="px-4 py-6">
        <ProductForm
          product={product}
          allTags={tags}
          allLocations={locations}
        />
      </div>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/products/[id]/edit/
git commit -m "feat(frontend): product edit page"
```

---

## Task 23 — Search page with debounce, filters, and result highlighting

- [ ] Create directory `D:/Projetos/catalog-itens/frontend/src/app/(shell)/search/` and create `D:/Projetos/catalog-itens/frontend/src/app/(shell)/search/page.tsx`:

```typescript
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
        <SearchInput initialQuery={q ?? ''} />
        <SearchFilters
          rooms={rooms}
          tags={tags}
          selectedRoomId={roomId}
          selectedTagId={tagId}
        />
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
        {result.page.totalElements} resultado{result.page.totalElements !== 1 ? 's' : ''}
        {q && ` para "${q}"`}
      </p>

      {result.content.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">🔍</span>
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
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/search/SearchInput.tsx`:

```typescript
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition, useCallback, useRef, useEffect } from 'react'

interface SearchInputProps {
  initialQuery: string
}

export function SearchInput({ initialQuery }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with URL changes (e.g. browser back)
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      params.delete('page')
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(value), 300)
  }

  function handleClear() {
    setQuery('')
    navigate('')
  }

  return (
    <div className="relative">
      <label htmlFor="search-input" className="sr-only">
        Buscar produtos
      </label>
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-barbie-accent"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>
      <input
        id="search-input"
        type="search"
        autoFocus
        autoComplete="off"
        value={query}
        onChange={handleChange}
        placeholder="Buscar produtos..."
        className="w-full rounded-xl border border-barbie-accent bg-white py-2.5 pl-10 pr-10 text-barbie-text placeholder:text-barbie-accent/70 focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-barbie-accent hover:text-barbie-dark"
        >
          ✕
        </button>
      )}
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/search/SearchFilters.tsx`:

```typescript
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils/cn'
import type { RoomSummary, TagResponse } from '@/lib/api/types'

interface SearchFiltersProps {
  rooms: RoomSummary[]
  tags: TagResponse[]
  selectedRoomId?: string
  selectedTagId?: string
}

export function SearchFilters({
  rooms,
  tags,
  selectedRoomId,
  selectedTagId,
}: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {rooms.length > 0 && (
        <div>
          <label htmlFor="room-filter" className="sr-only">
            Filtrar por cômodo
          </label>
          <select
            id="room-filter"
            value={selectedRoomId ?? ''}
            onChange={(e) => setParam('roomId', e.target.value || undefined)}
            className="w-full rounded-xl border border-barbie-accent bg-white px-3 py-2 text-sm text-barbie-text focus:border-barbie-primary focus:outline-none focus:ring-2 focus:ring-barbie-primary/30"
          >
            <option value="">Todos os cômodos</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tags.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por tag"
        >
          {tags.map((tag) => {
            const isSelected = selectedTagId === tag.id
            return (
              <button
                key={tag.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => setParam('tagId', isSelected ? undefined : tag.id)}
                style={
                  tag.color
                    ? {
                        backgroundColor: isSelected ? `${tag.color}` : `${tag.color}22`,
                        borderColor: tag.color,
                        color: isSelected ? '#fff' : tag.color,
                      }
                    : undefined
                }
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  !tag.color &&
                    (isSelected
                      ? 'border-barbie-primary bg-barbie-primary text-white'
                      : 'border-barbie-accent bg-barbie-bg-soft text-barbie-text hover:border-barbie-primary'),
                )}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/search/ResultCard.tsx`:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { highlightSegments } from '@/lib/utils/highlight'
import type { ProductSummary } from '@/lib/api/types'

interface ResultCardProps {
  product: ProductSummary
  query: string
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query)
  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            className="rounded bg-barbie-accent/30 px-0.5 text-barbie-text not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export function ResultCard({ product, query }: ResultCardProps) {
  const thumbnail = product.photos[0]

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-start gap-3 rounded-2xl border border-barbie-accent/20 bg-barbie-surface p-3 hover:bg-barbie-bg-soft transition-colors focus-visible:rounded-2xl"
    >
      {thumbnail ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={thumbnail.thumbnailUrl}
            alt={`Foto de ${product.name}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-barbie-bg-soft text-3xl">
          📦
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-barbie-text leading-tight">
          <HighlightedText text={product.name} query={query} />
        </h3>

        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-barbie-text/60">
            <HighlightedText text={product.description} query={query} />
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <Badge key={tag.id} variant="custom" color={tag.color}>
              {tag.name}
            </Badge>
          ))}
        </div>

        {product.totalQuantity > 0 && (
          <p className="mt-1 text-xs font-medium text-barbie-dark">
            {product.totalQuantity} un. em {product.locationCount} local{product.locationCount !== 1 ? 'is' : ''}
          </p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] Wrap `SearchInput` and `SearchFilters` in a Suspense boundary in the search page since they call `useSearchParams`. Update `D:/Projetos/catalog-itens/frontend/src/app/(shell)/search/page.tsx` to add Suspense around the client filter/input section:

```typescript
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
        <Suspense fallback={<div className="h-10 rounded-xl bg-barbie-bg-soft animate-pulse" />}>
          <SearchInput initialQuery={q ?? ''} />
        </Suspense>
        <Suspense fallback={<div className="h-8 rounded-xl bg-barbie-bg-soft animate-pulse" />}>
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
        {result.page.totalElements} resultado{result.page.totalElements !== 1 ? 's' : ''}
        {q && ` para "${q}"`}
      </p>

      {result.content.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">🔍</span>
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
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/(shell)/search/ src/components/search/
git commit -m "feat(frontend): search page with debounced input, filters and result highlighting"
```

---

## Task 24 — Global error.tsx, loading.tsx, not-found.tsx

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/error.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // In production you would log this to an error tracking service
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="bg-barbie-bg-light font-poppins">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <span className="text-6xl" aria-hidden="true">⚠️</span>
          <h1 className="text-2xl font-extrabold text-barbie-text">
            Algo deu errado
          </h1>
          <p className="max-w-sm text-sm text-barbie-text/60">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-barbie-text/30">
              ID: {error.digest}
            </p>
          )}
          <Button onClick={reset} variant="primary">
            Tentar novamente
          </Button>
        </div>
      </body>
    </html>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/loading.tsx`:

```typescript
import { Spinner } from '@/components/ui/Spinner'

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-barbie-bg-light">
      <Spinner size="lg" label="Carregando..." />
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/not-found.tsx`:

```typescript
import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-barbie-bg-light px-4 text-center">
      <span className="text-6xl" aria-hidden="true">🔍</span>
      <h1 className="text-3xl font-extrabold text-barbie-text">
        Página não encontrada
      </h1>
      <p className="max-w-sm text-sm text-barbie-text/60">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-barbie-gradient px-8 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
      >
        Ir para o início
      </Link>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/error.tsx src/app/loading.tsx src/app/not-found.tsx
git commit -m "feat(frontend): global error boundary, loading and not-found pages"
```

---

## Task 25 — next.config.ts: standalone output, remotePatterns, security headers

- [ ] Replace `D:/Projetos/catalog-itens/frontend/next.config.ts` with:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        // MinIO accessed through the backend presigned URL proxy
        // In production this is the internal Docker service name
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/catalog-photos/**',
      },
      {
        // Allow localhost MinIO for development
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/catalog-photos/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http://minio:9000 http://localhost:9000",
              "font-src 'self'",
              "connect-src 'self' http://localhost:8080",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // TypeScript strict mode enforced at build time
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/.env.local.example`:

```bash
# Backend URL for server-side requests (RSC, Server Actions)
# In Docker this points to the internal service name
API_URL=http://localhost:8080

# Public backend URL for client-side requests (proxied through Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

- [ ] Create the API proxy route handler so client-side SWR calls go through Next.js (avoiding CORS issues). Create `D:/Projetos/catalog-itens/frontend/src/app/api/[...path]/route.ts`:

```typescript
import { type NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:8080'

async function proxyRequest(request: NextRequest, path: string): Promise<NextResponse> {
  const targetUrl = `${BACKEND_URL}/${path}${
    request.nextUrl.search ? request.nextUrl.search : ''
  }`

  const headers = new Headers()

  // Forward safe headers from client
  const forwardHeaders = [
    'content-type',
    'accept',
    'x-request-id',
  ]
  forwardHeaders.forEach((header) => {
    const value = request.headers.get(header)
    if (value) headers.set(header, value)
  })

  let body: BodyInit | null = null
  const method = request.method
  if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
    body = await request.blob()
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    // Do not follow redirects automatically — pass them back to the client
    redirect: 'manual',
  })

  const responseHeaders = new Headers()
  const allowedResponseHeaders = [
    'content-type',
    'cache-control',
    'etag',
    'last-modified',
    'location',
  ]
  allowedResponseHeaders.forEach((header) => {
    const value = response.headers.get(header)
    if (value) responseHeaders.set(header, value)
  })

  const responseBody = response.status === 204 ? null : await response.blob()

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add next.config.ts .env.local.example src/app/api/
git commit -m "feat(frontend): next.config with standalone output, remotePatterns, security headers and API proxy"
```

---

## Task 26 — Tags management page

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/(shell)/tags/page.tsx`:

```typescript
import { getTags } from '@/lib/api/tags'
import { PageHeader } from '@/components/layout/PageHeader'
import { TagsManager } from '@/components/tags/TagsManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tags' }

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div>
      <PageHeader title="Tags" />
      <div className="px-4 py-4">
        <TagsManager initialTags={tags} />
      </div>
    </div>
  )
}
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/components/tags/TagsManager.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createTag, deleteTag } from '@/lib/api/tags'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { showToast } from '@/components/ui/Toast'
import type { TagResponse } from '@/lib/api/types'

interface TagsManagerProps {
  initialTags: TagResponse[]
}

interface CreateTagFormData {
  name: string
  color: string
}

const DEFAULT_COLORS = [
  '#ec407a',
  '#f06292',
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
]

export function TagsManager({ initialTags }: TagsManagerProps) {
  const [tags, setTags] = useState<TagResponse[]>(initialTags)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTagFormData>({
    defaultValues: { name: '', color: DEFAULT_COLORS[0] },
  })

  const colorValue = watch('color')

  async function onSubmit(data: CreateTagFormData) {
    setSubmitting(true)
    try {
      const created = await createTag({
        name: data.name.trim(),
        color: data.color || null,
      })
      setTags((prev) => [...prev, created])
      reset({ name: '', color: DEFAULT_COLORS[0] })
      showToast('Tag criada com sucesso!', 'success')
    } catch {
      showToast('Erro ao criar tag.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(tag: TagResponse) {
    if (!confirm(`Remover a tag "${tag.name}"? Ela será desassociada de todos os produtos.`)) {
      return
    }
    setDeletingId(tag.id)
    try {
      await deleteTag(tag.id)
      setTags((prev) => prev.filter((t) => t.id !== tag.id))
      showToast(`Tag "${tag.name}" removida.`, 'info')
    } catch {
      showToast('Erro ao remover tag.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create form */}
      <section aria-label="Criar nova tag">
        <h2 className="mb-3 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Nova tag
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <Input
            label="Nome"
            placeholder="ex: Ferramentas"
            error={errors.name?.message}
            {...register('name', {
              required: 'Nome é obrigatório',
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-barbie-text">Cor</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Selecionar cor ${color}`}
                  aria-pressed={colorValue === color}
                  onClick={() => setValue('color', color)}
                  style={{ backgroundColor: color }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    colorValue === color
                      ? 'scale-125 border-white shadow-md'
                      : 'border-transparent hover:scale-110'
                  }`}
                />
              ))}
              <input
                type="color"
                {...register('color')}
                aria-label="Cor personalizada"
                className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
            </div>
          </div>

          {colorValue && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-barbie-text/60">Preview:</span>
              <Badge variant="custom" color={colorValue}>
                {watch('name') || 'Tag'}
              </Badge>
            </div>
          )}

          <Button type="submit" loading={submitting} variant="primary">
            Criar tag
          </Button>
        </form>
      </section>

      {/* Existing tags */}
      <section aria-label="Tags existentes">
        <h2 className="mb-3 text-sm font-bold text-barbie-text/70 uppercase tracking-wider">
          Tags ({tags.length})
        </h2>

        {tags.length === 0 ? (
          <p className="text-sm text-barbie-text/50">Nenhuma tag criada ainda.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-1">
                <Badge variant="custom" color={tag.color}>
                  {tag.name}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  disabled={deletingId === tag.id}
                  aria-label={`Remover tag ${tag.name}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-barbie-text/30 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/(shell)/tags/ src/components/tags/TagsManager.tsx
git commit -m "feat(frontend): tags management page with create and delete"
```

---

## Task 27 — Location edit page

- [ ] Create `D:/Projetos/catalog-itens/frontend/src/app/locations/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getLocationById } from '@/lib/api/locations'
import { getRooms } from '@/lib/api/rooms'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationForm } from '@/components/locations/LocationForm'
import { ApiError } from '@/lib/api/client'
import type { Metadata } from 'next'

interface EditLocationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditLocationPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const loc = await getLocationById(id)
    return { title: `Editar ${loc.name}` }
  } catch {
    return { title: 'Editar Local' }
  }
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const { id } = await params

  let location
  try {
    location = await getLocationById(id)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  const rooms = await getRooms()

  return (
    <div>
      <PageHeader
        title="Editar Local"
        backHref={`/locations/${location.id}`}
        backLabel={`Voltar para ${location.name}`}
      />
      <div className="px-4 py-6">
        <LocationForm location={location} rooms={rooms} />
      </div>
    </div>
  )
}
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add src/app/locations/[id]/edit/
git commit -m "feat(frontend): location edit page"
```

---

## Task 28 — TypeScript strict mode and tsconfig

- [ ] Read the existing `D:/Projetos/catalog-itens/frontend/tsconfig.json` and replace it with:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] Run the TypeScript check to confirm no errors:

```bash
cd D:/Projetos/catalog-itens/frontend
npx tsc --noEmit
```

- [ ] Fix any type errors surfaced by the check before proceeding.

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add tsconfig.json
git commit -m "feat(frontend): enable TypeScript strict mode with noUncheckedIndexedAccess"
```

---

## Task 29 — Build verification

- [ ] Run the production build to confirm no build errors:

```bash
cd D:/Projetos/catalog-itens/frontend
npm run build
```

- [ ] If the build succeeds, confirm the `.next/standalone` directory was created:

```bash
ls D:/Projetos/catalog-itens/frontend/.next/standalone
```

- [ ] Commit the lockfile if it changed:

```bash
cd D:/Projetos/catalog-itens/frontend
git add package-lock.json
git commit -m "chore(frontend): update package-lock after build verification"
```

---

## Task 30 — Dockerfile for frontend

- [ ] Create `D:/Projetos/catalog-itens/frontend/Dockerfile`:

```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

- [ ] Create `D:/Projetos/catalog-itens/frontend/.dockerignore`:

```
node_modules
.next
.git
.env.local
.env*.local
README.md
Dockerfile
.dockerignore
npm-debug.log*
```

- [ ] Commit:

```bash
cd D:/Projetos/catalog-itens/frontend
git add Dockerfile .dockerignore
git commit -m "feat(frontend): multi-stage Dockerfile for production deployment"
```

---

## Final Summary

At the end of all tasks, the frontend directory structure will be:

```
frontend/
├── src/
│   ├── app/
│   │   ├── (shell)/
│   │   │   ├── layout.tsx            # Shell with BottomNav
│   │   │   ├── page.tsx              # Home with tabs
│   │   │   ├── search/page.tsx       # Search results
│   │   │   └── tags/page.tsx         # Tags management
│   │   ├── api/[...path]/route.ts    # Backend proxy
│   │   ├── rooms/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── not-found.tsx
│   │   │       └── edit/page.tsx
│   │   ├── locations/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── not-found.tsx
│   │   │       └── edit/page.tsx
│   │   ├── products/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── not-found.tsx
│   │   │       └── edit/page.tsx
│   │   ├── manifest.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── FAB.tsx
│   │   │   └── index.ts
│   │   ├── photos/
│   │   │   ├── PhotoCarousel.tsx
│   │   │   └── PhotoUploadZone.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── rooms/
│   │   │   ├── RoomCard.tsx
│   │   │   └── RoomForm.tsx
│   │   ├── locations/
│   │   │   ├── LocationCard.tsx
│   │   │   └── LocationForm.tsx
│   │   ├── search/
│   │   │   ├── HomeSearchBar.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── ResultCard.tsx
│   │   └── tags/
│   │       ├── TagBadge.tsx
│   │       ├── TagPicker.tsx
│   │       └── TagsManager.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   ├── rooms.ts
│   │   │   ├── locations.ts
│   │   │   ├── products.ts
│   │   │   ├── tags.ts
│   │   │   └── photos.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── highlight.ts
│   └── middleware.ts
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── Dockerfile
├── .dockerignore
├── .env.local.example
└── package.json
```

Key architectural decisions implemented:
- Server Components by default on all data pages
- Client Components only where required: forms, carousel, search input, tag picker, photo upload, toast, FAB
- All URL state is in query params — bookmarkable, browser-back works
- `useOptimistic` from React 19 in `ProductForm` location list
- `useTransition` in `SearchInput` for non-blocking debounced navigation
- Suspense boundaries around all async data fetches and `useSearchParams` callers
- `next/font/google` for Poppins — zero external font requests in production
- `output: 'standalone'` for Docker deployment
- API proxy route at `/api/[...path]` routes client-side requests through Next.js to avoid CORS
- `X-Request-Id` injected in all API calls for backend correlation logging
- All images use `next/image` with proper `sizes` attributes
- `aria-*` attributes on all interactive elements per spec
- `robots: noindex` on root metadata — personal app
