import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/lib/auth/session'

const API_URL = process.env.API_URL ?? 'http://localhost:8080'

export async function POST(request: Request) {
  const reqId = `login-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Requisição inválida' }, { status: 400 })
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { message: 'E-mail e senha são obrigatórios' },
      { status: 400 },
    )
  }

  let backendRes: Response
  try {
    backendRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    console.error(`[auth/login ${reqId}] backend unreachable`, err)
    return NextResponse.json({ message: 'Serviço indisponível' }, { status: 502 })
  }

  if (!backendRes.ok) {
    const error = await backendRes
      .json()
      .catch(() => ({ message: 'Erro ao autenticar' }))
    return NextResponse.json(error, { status: backendRes.status })
  }

  const user = await backendRes.json()

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name })
}
