import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    // Rate limit: 5 registrations per hour per IP
    const rateLimitResponse = await applyRateLimit(request, 5, 60 * 60 * 1000)
    if (rateLimitResponse) return rateLimitResponse

    const { email, username, password, robloxUsername } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedUsername = String(username || '').trim()
    const normalizedRobloxUsername = String(robloxUsername || '').trim()

    if (!normalizedEmail || !normalizedUsername || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Input validation
    if (
      normalizedEmail.length > 255 ||
      normalizedUsername.length > 50 ||
      password.length < 6 ||
      password.length > 128 ||
      normalizedRobloxUsername.length > 50
    ) {
      return NextResponse.json(
        { error: 'Invalid input length' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Username validation (alphanumeric, underscore, hyphen only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(normalizedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
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
