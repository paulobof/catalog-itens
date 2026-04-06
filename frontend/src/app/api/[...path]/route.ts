import { type NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:8080'

async function proxyRequest(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  const targetUrl = `${BACKEND_URL}/api/${path}${
    request.nextUrl.search ? request.nextUrl.search : ''
  }`

  const headers = new Headers()

  // Forward safe headers from client
  const forwardHeaders = ['content-type', 'accept', 'x-request-id']
  forwardHeaders.forEach((header) => {
    const value = request.headers.get(header)
    if (value) headers.set(header, value)
  })

  let body: BodyInit | null = null
  const method = request.method
  if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
    body = await request.blob()
  }

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
    })
  } catch {
    return NextResponse.json(
      { error: 'Backend unavailable' },
      { status: 502 },
    )
  }

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
