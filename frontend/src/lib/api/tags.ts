import { fetchApi } from './client'
import type { TagResponse, CreateTagRequest, UpdateTagRequest } from './types'

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
