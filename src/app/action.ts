'use server'

import { QueryInfo, SearchStateResponse } from '@/app/types'
import { headers } from 'next/headers'
import { getRecentSearches, handleSearchRequest } from '@/lib/search'

export async function search (
  prevState: any, formData: FormData): Promise<SearchStateResponse> {
  // const ip = request().ip
  const ip = headers().get('x-forwarded-for')
  const response = await handleSearchRequest({ query: formData.get('query') },
    ip)
  console.log(response)
  return {
    message: 'query: ' + formData.get('query'),
    error: null,
    response: response,
  }
}

export async function recentSearches (): Promise<QueryInfo[]> {
  return await getRecentSearches()

}
