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
