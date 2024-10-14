"use server"

import { QueryInfo, SearchStateResponse } from "@/app/types"
import { headers } from "next/headers"
import {
  getRecentSearches,
  handleSearchRequest,
  SearchBody,
} from "@/lib/search"

export async function searchAction(
  searchBody: SearchBody,
): Promise<SearchStateResponse> {
  // const ip = request().ip
  const ip = headers().get("x-forwarded-for")
  return await handleSearchRequest(searchBody, ip)
}

export async function recentSearches(): Promise<QueryInfo[]> {
  return await getRecentSearches()
}
