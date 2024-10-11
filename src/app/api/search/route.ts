import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import { getRecentSearches, handleSearchRequest } from '@/lib/search'

export async function POST (req: NextRequest) {
  console.log('Incoming request:', req.method, req.url)

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
