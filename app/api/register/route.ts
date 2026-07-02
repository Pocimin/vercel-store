import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { applyRateLimit, applyTokenRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
])

function isSameOrigin(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  try {
    if (origin) return new URL(origin).host === host
    if (referer) return new URL(referer).host === host
  } catch {
    return false
  }

  return false
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function registrationErrorResponse(error: unknown) {
  console.error('Registration error:', error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with that email or username already exists.' },
        { status: 409 }
      )
    }

    if (error.code === 'P2021' || error.code === 'P2022') {
      return NextResponse.json(
        { error: 'Database schema is out of date. Run the Supabase setup SQL again.' },
        { status: 500 }
      )
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return NextResponse.json(
      { error: 'Database connection failed. Check DATABASE_URL in Vercel.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Registration is the current attack target. Keep this tight.
    const rateLimitResponse = await applyRateLimit(request, 3, 10 * 60 * 1000)
    if (rateLimitResponse) return rateLimitResponse

    const { email, username, password, robloxUsername, website, formStartedAt } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedUsername = String(username || '').trim()
    const normalizedRobloxUsername = String(robloxUsername || '').trim()
    const emailDomain = normalizedEmail.split('@')[1] || ''
    const formAge = Date.now() - Number(formStartedAt || 0)

    if (website || formAge < 2500 || formAge > 60 * 60 * 1000) {
      return badRequest('Please refresh the page and try again.')
    }

    const tokenLimitResponse =
      await applyTokenRateLimit(`register:email:${normalizedEmail}`, 2, 60 * 60 * 1000) ||
      await applyTokenRateLimit(`register:user:${normalizedUsername.toLowerCase()}`, 2, 60 * 60 * 1000) ||
      await applyTokenRateLimit(`register:domain:${emailDomain}`, 25, 10 * 60 * 1000) ||
      await applyTokenRateLimit(`register:ipday:${getClientIdentifier(request)}`, 8, 24 * 60 * 60 * 1000)

    if (tokenLimitResponse) return tokenLimitResponse

    if (!normalizedEmail || !normalizedUsername || !password) {
      return badRequest('Missing required fields')
    }

    // Input validation
    if (
      normalizedEmail.length > 255 ||
      normalizedUsername.length > 50 ||
      password.length < 6 ||
      password.length > 128 ||
      normalizedRobloxUsername.length > 50
    ) {
      return badRequest('Invalid input length')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return badRequest('Invalid email format')
    }

    if (DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
      return badRequest('Please use a real email provider.')
    }

    // Username validation (alphanumeric, underscore, hyphen only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(normalizedUsername)) {
      return badRequest('Username can only contain letters, numbers, underscores, and hyphens')
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        robloxUsername: normalizedRobloxUsername || null,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      }
    })
  } catch (error) {
    return registrationErrorResponse(error)
  }
}
