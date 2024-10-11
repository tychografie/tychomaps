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

  const ip = req.ip ?? '127.0.0.1'


  try {
    const response = await handleSearchRequest(await req.json(), ip)
    return NextResponse.json(response)
  } catch (e) {
    return NextResponse.json({
      error: e.message,
    }, {
      status: 500,
    })
  }
}
