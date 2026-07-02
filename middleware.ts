import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  if (host === 'v0-roblox-script-store.vercel.app') {
    return new NextResponse('Not found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
