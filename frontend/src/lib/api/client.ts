/**
 * Base API client for catalog-itens backend.
 *
 * - Server-side (RSC, Server Actions): uses API_URL and reads the session
 *   cookie to add Authorization: Bearer header so the backend can authenticate.
 * - Client-side: uses relative URL (proxied via Next.js route handler, which
 *   handles the JWT forwarding).
 * - Injects X-Request-Id for correlation logging
 */

import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

export class ApiError extends Error {
  public readonly status: number
  public readonly path?: string
  public readonly requestId?: string

  constructor(
    status: number,
    message: string,
    path?: string,
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
    this.requestId = requestId
  }
}

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal Docker network URL
    return process.env.API_URL ?? 'http://localhost:8080'
  }
  // Client-side: use relative URL (proxied through Next.js route handler)
  return ''
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

async function getAuthHeader(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    // Browser: o proxy route handler cuida do JWT forwarding
    return null
  }
  // Server-side: le o cookie e envia como Authorization: Bearer
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE_NAME)
    return session?.value ? `Bearer ${session.value}` : null
  } catch {
    return null
  }
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

  const authHeader = await getAuthHeader()
  if (authHeader && !headers.has('Authorization')) {
    headers.set('Authorization', authHeader)
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
