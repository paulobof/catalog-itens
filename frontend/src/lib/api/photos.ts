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
