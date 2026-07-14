'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []

          const cookies: { name: string; value: string }[] = []
          document.cookie.split(';').forEach(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            if (name) {
              const value = rest.join('=')
              cookies.push({
                name,
                value: decodeURIComponent(value)
              })
            }
          })
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return

          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`

            if (options?.maxAge) {
              cookieString += `; Max-Age=${options.maxAge}`
            }
            if (options?.expires) {
              cookieString += `; expires=${new Date(options.expires).toUTCString()}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.secure) {
              cookieString += '; secure'
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }

            document.cookie = cookieString
          })
        },
      },
    }
  )
}
