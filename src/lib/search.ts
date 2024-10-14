import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import {
  PlaceDetail,
  QueryInfo,
  SearchObject,
  SearchStateResponse,
} from '@/app/types'

const client = new MongoClient(process.env.MONGODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true })

export const dynamic = 'force-dynamic' // defaults to auto
const API_VERSION = '1.0.0'

export function tokenizeAndNormalize (text) {
  const stopWords = new Set([
    'the',
    'in',
    'and',
    'of',
    'a',
    'to',
    'is',
    'it',
    'with',
    'for',
    'on',
    'that',
    'this',
    'at',
    'by',
    'an',
    'be',
    'as',
    'from',
    'or',
    'are',
    'was',
    'but',
    'not',
    'have',
    'has',
    'had',
    'which',
    'you',
    'we',
    'they',
    'i',
    'he',
    'she',
    'him',
    'her',
    'them',
    'us',
    'our',
    'your',
    'their',
    'its',
    'my',
    'mine',
    'yours',
    'his',
    'hers',
    'ours',
    'theirs'])
  return text.toLowerCase().split(/\s+/).filter(word => !stopWords.has(word))
}

export function containsAnyToken (text, tokens) {
  const lowerText = text.toLowerCase()
  return tokens.some(token => lowerText.includes(token))
}

export async function logSearchAndResults (
  ip, query, aiContent, aiResponseContent, country, latitude, longitude,
  mapsRequest, resultCount, retryAttempted, places, isLatLongMode) {
  // || req.connection.remoteAddress
  const searchId = uuidv4()
  try {
    await client.connect()
    const database = client.db('tychomapsmongodb')
    const searchesCollection = database.collection('searches')
    const resultsCollection = database.collection('search_results')

    const timestamp = new Date()

    // Parse aiResponseContent to extract all fields
    let parsedAiResponse = {
      originalQuery: 'Unknown',
      aiQuery: 'Unknown',
      aiEmoji: 'Unknown',
      aiType: 'Unknown',
      modeisLatLong: false,
    }

    if (aiResponseContent) {
      try {
        parsedAiResponse = JSON.parse(aiResponseContent)
      } catch (parseError) {
        console.error('Error parsing aiResponseContent:', parseError)
      }
    }

    const searchEntry = {
      searchId: searchId,
      ip: ip,
      originalQuery: query,
      aiContent: aiContent,
      aiResponseContent: aiResponseContent || 'Unknown',
      country: country || 'Unknown',
      latitude: latitude || 'Unknown',
      longitude: longitude || 'Unknown',
      mapsRequest: mapsRequest !== undefined ? mapsRequest : 'Unknown',
      resultCount: resultCount !== undefined ? resultCount : 'Unknown',
      retryAttempted: retryAttempted,
      userRating: 0,
      timestamp: timestamp,
      isLatLongMode: isLatLongMode,
    }
    await searchesCollection.insertOne(searchEntry)

    const resultEntry = {
      _id: searchId,
      originalQuery: parsedAiResponse.originalQuery,
      aiQuery: parsedAiResponse.aiQuery,
      data: [
        {
          aiEmoji: parsedAiResponse.aiEmoji,
          aiType: parsedAiResponse.aiType,
          resultCount: places.length,  // Use the actual number of places
          modeisLatLong: isLatLongMode,
          timestamp: timestamp,
        },
      ],
      places,
    }
    await resultsCollection.insertOne(resultEntry)

  } catch (error) {
    console.error('Error logging search and results:', error)
  } finally {
    await client.close()
  }

  return searchId
}

export async function getCachedResults (query) {
  try {
    await client.connect()
    const database = client.db('tychomapsmongodb')
    const resultsCollection = database.collection('search_results')

    const cachedResults = await resultsCollection.find({
      $or: [
        { originalQuery: { $regex: query, $options: 'i' } },
        { aiQuery: { $regex: query, $options: 'i' } },
      ],
      'data.0.resultCount': { $gte: 5 },  // Ensure at least 5 results
      'data.0.modeisLatLong': false,  // Exclude modeisLatLong: true results
    }).sort({ 'data.0.timestamp': -1 }).limit(5).toArray()

    console.log('Potential cached results:',
      JSON.stringify(cachedResults, null, 2))

    for (const result of cachedResults) {
      if (result.places && result.places.length >= 5) {
        console.log('Using cached result:', result.originalQuery)
        const formattedPlaces = result.places.map((placeData: PlaceDetail) => {
          return {
            ...placeData,
            name: placeData.displayName?.text || placeData.name || 'Unknown',
          }
        })
        return {
          places: formattedPlaces,
          aiResponse: {
            aiEmoji: result.data[0].aiEmoji || '🔍',
            aiType: result.data[0].aiType || 'cached',
            originalQuery: result.originalQuery,
          },
        }
      }
    }
    console.log('No suitable cached results found')
    return null
  } catch (error) {
    console.error('Error getting cached results:', error)
    return null
  } finally {
    await client.close()
  }
}

// Function to read the query file
export async function readQueryFile (filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'src', 'lib', filename)
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content.trim()
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error)
    throw new Error(`Failed to read ${filename}`)
  }
}

export const aiRequest = async (query, country, retryQuery = null) => {
  const isLatLongMode = query.includes('modeisLatLong:') ||
    (country && country.includes('modeisLatLong:'))
  const queryFile = isLatLongMode ? 'latlongQuery.text' : 'regularQuery.txt'
  const queryPrefix = await readQueryFile(queryFile)
  // fs.readFileSync("./" + queryFile, 'utf8').
  //   trim()
  const fullAiContent = retryQuery ||
    `${queryPrefix} ${country ? `${country} ` : ''} ${query}`

  console.log('AI Request Content:', fullAiContent)

  try {
    const aiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
      process.env.GOOGLE_MAPS_API_KEY,
      {
        contents: [
          {
            parts: [
              {
                text: fullAiContent,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('AI Response:', aiResponse.data)

    if (aiResponse?.data?.candidates && aiResponse.data.candidates.length > 0 &&
      aiResponse.data.candidates[0].content?.parts &&
      aiResponse.data.candidates[0].content.parts.length > 0 &&
      aiResponse.data.candidates[0].content.parts[0].text) {
      const aiResponseText = aiResponse.data.candidates[0].content.parts[0].text.trim()
      try {
        // Remove any potential markdown formatting
        const cleanedResponse = aiResponseText.replace(/```json\n?|\n?```/g,
          '').trim()
        const parsedResponse = JSON.parse(cleanedResponse)

        // Validate the parsed response
        if (!parsedResponse.aiQuery || typeof parsedResponse.aiQuery !==
          'string') {
          throw new Error(
            'Invalid AI response structure: missing or invalid aiQuery')
        }

        // Add the modeisLatLong flag to the parsedResponse
        parsedResponse.modeisLatLong = isLatLongMode

        return {
          aiContent: fullAiContent,
          aiResponse: parsedResponse,
        }
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError)
        throw new Error('Invalid AI response format')
      }
    } else {
      console.log('No valid response from AI', aiResponse.data)
      throw new Error('No valid response from AI')
    }
  } catch (error) {
    console.error('Error in AI Request:', error.message)
    throw error
  }
}

export const mapsRequest = async (
  mapsQuery: string, latitude: string, longitude: string, radius: number) => {

  const minRating = mapsQuery.toLowerCase().includes('club') ? 4.0 : 4.5
  const requestPayload = { textQuery: mapsQuery, minRating }

  if (latitude && longitude) {
    requestPayload.locationBias = {
      circle: {
        center: {
          latitude: latitude,
          longitude: longitude,
        }, radius: parseFloat(radius),
      },
    }
  }

  console.log('Maps Request Payload:', requestPayload)

  try {
    const mapsResponse = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
// MORE TYPE DETAILS FOR FUTURE REF   'X-Goog-FieldMask': 'places.displayName,places.type,places.primaryType,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.googleMapsUri,places.location',
          'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.location',
        },
      },
    )

    console.log('Maps Response:', mapsResponse.data)

    return mapsResponse.data
  } catch (error) {
    console.error('Error in Maps Request:', error.message)
    throw error
  }
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

export const addDistanceToPlaces = (places, userLat, userLon) => {
  return places.map(place => ({
    ...place,
    distance: {
      distance: calculateDistance(userLat, userLon, place.location.latitude,
        place.location.longitude),
    },
  }))
}

export const mapsRequestWithDistance = async (
  mapsQuery, latitude, longitude, radius) => {
  const mapsResponse = await mapsRequest(mapsQuery, latitude, longitude,
    radius)

  if (latitude && longitude && mapsResponse.places) {
    mapsResponse.places = addDistanceToPlaces(mapsResponse.places, latitude,
      longitude)
  }

  return mapsResponse
}

export const processor = async (
  mapsResponse, aiQuery, hasLocationInfo, isLatLongMode) => {
  if (!mapsResponse || !mapsResponse.places || mapsResponse.places.length ===
    0) {
    throw new Error('No places found')
  }

  let filteredPlaces = mapsResponse.places.filter(place => {
    const reviewCount = place.userRatingCount || 0
    return reviewCount >= 10 && reviewCount <= 1500
  })

  let sortedPlaces = filteredPlaces.map(place => ({
    ...place,
    name: place.displayName?.text || 'Unknown',
    rating: place.rating || 0,
    userRatingCount: place.userRatingCount || 0,
    distance: place.distance?.distance || Infinity,
  }))

  console.log('Before sorting:',
    sortedPlaces.map(p => ({ name: p.name, distance: p.distance })))

  if (isLatLongMode) {
    console.log('Sorting by distance (latlong mode)')
    sortedPlaces.sort((a, b) => a.distance - b.distance)
  } else {
    console.log('Sorting by rating (regular mode)')
    sortedPlaces.sort((a, b) => b.rating - a.rating)
  }

  console.log('After sorting:',
    sortedPlaces.map(p => ({ name: p.name, distance: p.distance })))

  return sortedPlaces
}

export async function getRecentSearches (): Promise<QueryInfo> {
  try {
    await client.connect()
    const database = client.db('tychomapsmongodb')
    const resultsCollection = database.collection('search_results')

    const recentSearches = await resultsCollection.find({
      'data.0.resultCount': { $gte: 5 },  // Only include searches with 5 or more results
      $or: [
        { 'data.0.modeisLatLong': { $ne: true } },  // Include where modeisLatLong is not true
        { 'data.0.modeisLatLong': { $exists: false } },  // Include where modeisLatLong doesn't exist
      ],
    }).
      sort({ 'data.0.timestamp': -1 }).
      limit(30)  // Increased limit to ensure we have enough unique results
      .toArray()

    console.log('Raw recent searches from DB:',
      JSON.stringify(recentSearches, null, 2))

    const uniqueSearches = []
    const seenEmojis = new Set()
    const seenTypes = new Set()

    for (const search of recentSearches) {
      const emoji = search.data[0].aiEmoji
      const type = search.data[0].aiType
      const resultCount = search.data[0].resultCount

      if (!seenEmojis.has(emoji) && !seenTypes.has(type) && resultCount >= 5) {
        uniqueSearches.push({
          originalQuery: search.originalQuery,
          aiEmoji: emoji,
          aiType: type,
        })
        seenEmojis.add(emoji)
        seenTypes.add(type)
      }

      if (uniqueSearches.length === 10) break  // Stop after getting 10 unique searches
    }

    console.log('Formatted unique recent searches:',
      JSON.stringify(uniqueSearches, null, 2))

    return uniqueSearches
  } catch (error) {
    console.error('Error getting recent searches:', error)
    return []
  } finally {
    await client.close()
  }
}

export type SearchBody = {
  query: string,
  latitude: string,
  longitude: string,
  country: string,
  radius: number
}
export const handleSearchRequest = async (
  body: SearchBody, ip: string): Promise<SearchStateResponse> => {

  const { query, latitude, longitude, country, radius } = body
  const isLatLongMode = !!(latitude && longitude)

  if (!query || query.length > 128) {
    console.error('Invalid query length:', query)
    throw new Error('Invalid query length', { status: 400 })
    // return NextResponse.json({ error: 'Invalid query length' }, { status: 400 })
  }

  async function handleRequest (
    retry = true, retryQuery = null,
    isRetryAttempt = false): Promise<SearchObject> {
    console.log('Handling request, retry:', retry, 'isRetryAttempt:',
      isRetryAttempt)
    let aiContent, aiResponse, mapsReq

    // Check for cached results only for non-lat/long queries
    if (!isLatLongMode) {
      const cachedResults = await getCachedResults(query)
      if (cachedResults) {
        console.log('Returning cached results')
        return {
          places: cachedResults.places,
          aiResponse: cachedResults.aiResponse,
          searchId: 'cached',
        }
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

      const searchId = await logSearchAndResults(ip, query, aiContent,
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

      return {
        places: sortedPlaces,
        aiResponse: {
          ...aiResponse,
          modeisLatLong: isLatLongMode.toString(),
        },
        searchId: searchId,
      }
    } catch (error) {
      console.error('Error in handleRequest:', error.message)
      if ((error.message === 'No places found' ||
        error.message.includes('Invalid AI response')) && retry) {
        console.log('Retrying due to error:', error.message)
        const newRetryQuery = `${aiContent} 5. IMPORTANT Your previous response was invalid or gave no results. Please provide a different query, focusing on the type of place and its characteristics, without mentioning specific locations. Ensure your response is a valid JSON object.`

        console.log('Retrying with query:', newRetryQuery)
        return await handleRequest(false, newRetryQuery, true)
      }
      const searchId = await logSearchAndResults(ip, query, aiContent,
        aiResponse ? JSON.stringify(aiResponse) : null, country, latitude,
        longitude, mapsReq, 0, isRetryAttempt, [], isLatLongMode)
      throw new Error(error.message || 'Unknown error',
        { searchId, cause: 500 })
      // return NextResponse.json(
      //   { error: error.message || 'Unknown error', searchId: searchId },
      //   { status: 500 })
    }
  }

  return await handleRequest()
}

