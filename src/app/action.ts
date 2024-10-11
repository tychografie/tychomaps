'use server'

import { SearchStateResponse } from '@/app/types'
import { headers } from 'next/headers'
import { getRecentSearches, handleSearchRequest } from '@/lib/search'
import { NextResponse } from 'next/server'

export async function search (
  prevState: any, formData: FormData): Promise<SearchStateResponse> {
  const ip = headers()['x-forwarded-for']
  const response = await handleSearchRequest({ query: formData.get('query') },
    ip)
  console.log(response)
  return {
    message: 'query: ' + formData.get('query'),
    error: null,
    response: response,
  }
}

export async function recentSearches () {
  return await getRecentSearches()

}
