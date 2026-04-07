import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'catalog-session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const ALG = 'HS256'

export interface SessionPayload {
  id: string
  email: string
  name: string | null
  [key: string]: unknown
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET environment variable must be set with at least 32 characters',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user: SessionPayload): Promise<string> {
  return await new SignJWT(user)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    })
    if (typeof payload.id !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return {
      id: payload.id,
      email: payload.email,
      name: (payload.name as string | null) ?? null,
    }
  } catch {
    return null
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE_SECONDS
