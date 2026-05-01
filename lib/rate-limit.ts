import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  interval: number // in milliseconds
  uniqueTokenPerInterval: number // max requests per interval
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check: async (request: NextRequest, limit: number, token: string) => {
      const now = Date.now()
      const tokenData = store[token]

      if (!tokenData || tokenData.resetTime < now) {
        store[token] = {
          count: 1,
          resetTime: now + config.interval,
        }
        return { success: true }
      }

      if (tokenData.count >= limit) {
        return {
          success: false,
          reset: tokenData.resetTime,
        }
      }

      tokenData.count += 1
      return { success: true }
    },
  }
}

export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown'
  return ip
}

export async function applyRateLimit(
  request: NextRequest,
  limit: number = 10,
  interval: number = 60 * 1000 // 1 minute default
): Promise<NextResponse | null> {
  const limiter = rateLimit({
    interval,
    uniqueTokenPerInterval: 500,
  })

  const identifier = getClientIdentifier(request)
  const result = await limiter.check(request, limit, identifier)

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.reset! - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.reset! - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    )
  }

  return null
}
