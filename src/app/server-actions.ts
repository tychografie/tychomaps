"use server"

import { MapRequestCounts, QueryInfo, SearchStateResponse } from "@/app/types"
import { headers } from "next/headers"
import {
  getMapRequestCounts,
  getRecentSearches,
  handleSearchRequest,
  SearchBody,
} from "@/lib/search"

export async function searchAction(
  searchBody: SearchBody,
): Promise<SearchStateResponse> {
  // const ip = request().ip
  const ip = headers().get("x-forwarded-for")!
  return await handleSearchRequest(searchBody, ip)
}

export async function recentSearches(): Promise<QueryInfo[]> {
  return await getRecentSearches()
}

export async function mapRequests(): Promise<MapRequestCounts> {
  return await getMapRequestCounts()
}