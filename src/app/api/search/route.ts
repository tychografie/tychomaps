import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import {
  aiRequest,
  containsAnyToken,
  getCachedResults,
  getRecentSearches,
  logSearchAndResults,
  mapsRequestWithDistance,
  processor,
  tokenizeAndNormalize,
} from '@/lib/search'

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

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get('x-forwarded-for')

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

  const body = await req.json()
  const { query, latitude, longitude, country, radius } = body
  const isLatLongMode = !!(latitude && longitude)

  if (!query || query.length > 128) {
    console.error('Invalid query length:', query)
    return NextResponse.json({ error: 'Invalid query length' }, { status: 400 })
  }

  async function handleRequest (
    retry = true, retryQuery = null, isRetryAttempt = false) {
    console.log('Handling request, retry:', retry, 'isRetryAttempt:',
      isRetryAttempt)
    let aiContent, aiResponse, mapsReq

    // Check for cached results only for non-lat/long queries
    if (!isLatLongMode) {
      const cachedResults = await getCachedResults(query)
      if (cachedResults) {
        console.log('Returning cached results')
        return NextResponse.json({
          places: cachedResults.places,
          aiResponse: cachedResults.aiResponse,
          searchId: 'cached',
        }, { status: 200 })
      }
    }

    try {
      const aiResult = await aiRequest(query,
        isLatLongMode ? `modeisLatLong:${country || ''}` : country, retryQuery)
      aiContent = aiResult.aiContent
      aiResponse = aiResult.aiResponse

      console.log('AI content and response received:', aiContent, aiResponse)

      if (!aiResponse || !aiResponse.aiQuery) {
        throw new Error('Invalid AI response structure')
      }

      const mapsResponse = await mapsRequestWithDistance(aiResponse.aiQuery,
        latitude, longitude, radius)
      mapsReq = aiResponse.aiQuery

      const hasLocationInfo = isLatLongMode || !!country
      const sortedPlaces = await processor(mapsResponse, aiResponse.aiQuery,
        hasLocationInfo, isLatLongMode)

      const resultCount = sortedPlaces.length
      const originalQueryTokens = tokenizeAndNormalize(query)
      const retryCondition1 = resultCount === 1 &&
        containsAnyToken(sortedPlaces[0].name, originalQueryTokens)
      const retryCondition2 = resultCount === 0

      const searchId = await logSearchAndResults(req, query, aiContent,
        aiResponse ? JSON.stringify(aiResponse) : null, country, latitude,
        longitude, mapsReq, resultCount, isRetryAttempt, sortedPlaces,
        isLatLongMode)

      if ((retryCondition1 || retryCondition2) && retry) {
        console.log('Retrying due to no results or only one partial match...')
        const newRetryQuery = `${aiContent} 5. IMPORTANT Your previous response was (${JSON.stringify(
          aiResponse)}) which gave no results in Google Maps API. Please provide a different query, focusing on the type of place and its characteristics, without mentioning specific locations.`

        console.log('Retrying with query:', newRetryQuery)
        return await handleRequest(false, newRetryQuery, true)
      }

      return NextResponse.json({
        places: sortedPlaces,
        aiResponse: {
          ...aiResponse,
          modeisLatLong: isLatLongMode.toString(),
        },
        searchId: searchId,
      }, { status: 200 })
    } catch (error) {
      console.error('Error in handleRequest:', error.message)
      if ((error.message === 'No places found' ||
        error.message.includes('Invalid AI response')) && retry) {
        console.log('Retrying due to error:', error.message)
        const newRetryQuery = `${aiContent} 5. IMPORTANT Your previous response was invalid or gave no results. Please provide a different query, focusing on the type of place and its characteristics, without mentioning specific locations. Ensure your response is a valid JSON object.`

        console.log('Retrying with query:', newRetryQuery)
        return await handleRequest(false, newRetryQuery, true)
      }
      const searchId = await logSearchAndResults(req, query, aiContent,
        aiResponse ? JSON.stringify(aiResponse) : null, country, latitude,
        longitude, mapsReq, 0, isRetryAttempt, [], isLatLongMode)
      return NextResponse.json(
        { error: error.message || 'Unknown error', searchId: searchId },
        { status: 500 })
    }
  }

  return await handleRequest()
}
