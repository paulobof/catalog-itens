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

function resolveUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path
  }
  const base = process.env.API_URL ?? 'http://localhost:8080'
  const normalized =
    path.startsWith('/api/') && !path.startsWith('/api/v1/')
      ? path.replace(/^\/api\//, '/api/v1/')
      : path
  return `${base}${normalized}`
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

async function getAuthHeader(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return null
  }
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
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function fetchApi<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...fetchInit } = options

  let url = resolveUrl(path)

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
    }

    throw new ApiError(response.status, errorMessage, errorPath, errorRequestId)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
