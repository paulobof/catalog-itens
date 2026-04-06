import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const COOKIE_NAME = 'catalog-session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erro ao autenticar' }))
      return NextResponse.json(error, { status: res.status })
    }

    const user = await res.json()

    // Set session cookie with user info (base64 encoded)
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
  } catch {
    return NextResponse.json({ message: 'Serviço indisponível' }, { status: 502 })
  }
}
