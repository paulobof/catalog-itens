/**
 * Base API client for catalog-itens backend.
 *
 * - Server-side (RSC, Server Actions): uses API_URL (internal Docker network)
 * - Client-side: uses NEXT_PUBLIC_API_URL (proxied via Next.js route handler)
 * - Injects X-Request-Id for correlation logging
 */

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
