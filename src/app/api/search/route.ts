import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { getRecentSearches, handleSearchRequest } from '@/lib/search'

export async function POST (req: NextRequest) {
  console.log('Incoming request:', req.method, req.url)

  const searchParams = new URL(req.url).searchParams

  if (req.method === 'GET') {
    if (searchParams.get('recentSearches') === 'true') {
      try {
        const recentSearches = await getRecentSearches()
        console.log('Sending recent searches:',
          JSON.stringify(recentSearches, null, 2))
        return NextResponse.json(recentSearches, { status: 200 })
      } catch (error) {
        console.error('Error fetching recent searches:', error)
        return NextResponse.json({ error: 'Failed to fetch recent searches' },
          { status: 500 })
      }
    }
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {

    const rl = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(3, '10s'),
    })

    const { success, limit, reset, remaining } = await rl.limit(
      `ratelimit_${ip}`)

    if (!success) {
      console.log('Rate limit exceeded for IP:', ip)
      return NextResponse.json(
        { error: 'please be kind to the locals, you need them in your future' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        },
      )
    }
  } else {
    console.log(
      'KV_REST_API_URL and KV_REST_API_TOKEN env vars not found, not rate limiting...')
  }

  return await handleSearchRequest(await req.json(), ip)
}
