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
  thumbnailUrl: string | null
  quantity: number
}

export interface CreateLocationRequest {
  roomId: string
  name: string
  description?: string | null
}

export interface UpdateLocationRequest {
  roomId: string
  name: string
  description?: string | null
}

export interface ProductSummary {
  id: string
  name: string
  description: string | null
  thumbnailUrl: string | null
  tags: TagResponse[]
  locations: ProductLocationResponse[]
  totalQuantity: number
  createdAt: string
  updatedAt: string
}

export interface ProductDetail {
  id: string
  name: string
  description: string | null
  photos: PhotoResponse[]
  tags: TagResponse[]
  locations: ProductLocationResponse[]
  totalQuantity: number
  createdAt: string
  updatedAt: string
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

export interface AddProductLocationRequest {
  locationId: string
  quantity: number
}

export interface UpdateProductLocationRequest {
  quantity: number
}

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
