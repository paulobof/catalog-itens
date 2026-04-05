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
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface RoomDetail extends RoomSummary {
  locations: LocationSummary[]
  photos: PhotoResponse[]
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
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface LocationDetail extends LocationSummary {
  products: ProductInLocationResponse[]
  photos: PhotoResponse[]
}

export interface ProductInLocationResponse {
  productId: string
  productName: string
  quantity: number
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
