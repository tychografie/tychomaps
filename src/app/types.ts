export type SearchStateResponse = {
  message?: string
  error?: string
  response?: SearchObject
}

export type Location = {
  latitude: number
  longitude: number
}

export type LocationWithAddress = Location & {
  address: string
  country: string
}

export type SuccessResponse<T> = {
  success: true
} & T

export type ErrorResponse = {
  success: false
  errorMessage?: string
}

export type DisplayName = {
  text: string
  languageCode: string
}

export type PlaceDetail = {
  location: Location
  rating: number
  googleMapsUri: string
  userRatingCount: number
  displayName: DisplayName
  name: string
  distance: number | null
}

export type Data = {
  aiEmoji: string
  aiType: string
  resultCount: number
  modeisLatLong: boolean
  timestamp: string
}

export type SearchObject = {
  _id: string
  originalQuery: string
  aiQuery: string
  data: Data[]
  aiResponse: {
    aiQuery: string
    aiEmoji: string
  }
  searchId: string
  places: PlaceDetail[]
}

export type QueryInfo = {
  originalQuery: string
  aiEmoji: string
  aiType: string
}

export type MapRequestCounts = {
  totalMapsRequests: number
  totalUsers: number
}