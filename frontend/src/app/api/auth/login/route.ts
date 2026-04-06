import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const COOKIE_NAME = 'catalog-session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: Request) {
  const reqId = `login-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  console.log(`[auth/login ${reqId}] start, API_URL=${API_URL}`)

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch (err) {
    console.error(`[auth/login ${reqId}] invalid JSON`, err)
    return NextResponse.json({ message: 'Requisição inválida' }, { status: 400 })
  }

  console.log(`[auth/login ${reqId}] forwarding to backend, email=${body.email}`)

  let backendRes: Response
  try {
    backendRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`[auth/login ${reqId}] backend fetch failed`, err)
    return NextResponse.json(
      { message: `Backend indisponível: ${err instanceof Error ? err.message : 'erro desconhecido'}` },
      { status: 502 },
    )
  }

  console.log(`[auth/login ${reqId}] backend status ${backendRes.status}`)

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ message: 'Erro ao autenticar' }))
    console.warn(`[auth/login ${reqId}] backend rejected`, error)
    return NextResponse.json(error, { status: backendRes.status })
  }

  const user = await backendRes.json()
  console.log(`[auth/login ${reqId}] success, user=${user.email}`)

  const sessionData = Buffer.from(JSON.stringify(user)).toString('base64')
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  return NextResponse.json(user)
}
