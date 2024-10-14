import { getRecentSearches } from '@/lib/search'
import { NextResponse } from 'next/server'

export async function GET () {
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
