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
