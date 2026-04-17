import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      licenseKey?: string | null
      licenseType?: string | null
    }
  }

  interface User {
    id: string
    email: string
    username: string
    licenseKey?: string | null
    licenseType?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    username?: string
    licenseKey?: string | null
    licenseType?: string | null
  }
}
