const { Ratelimit } = require("@upstash/ratelimit");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { kv } = require("@vercel/kv");
const { v4: uuidv4 } = require('uuid');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const API_VERSION = '1.0.0';

async function logSearchAndResults(req, query, aiContent, aiResponseContent, country, latitude, longitude, mapsRequest, resultCount, retryAttempted, places, isLatLongMode) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const searchId = uuidv4();
    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const searchesCollection = database.collection('searches');
        const resultsCollection = database.collection('search_results');

        const timestamp = new Date();

        // Parse aiResponseContent to extract all fields
        let parsedAiResponse = {
            originalQuery: "Unknown",
            aiQuery: "Unknown",
            aiEmoji: "Unknown",
            aiType: "Unknown",
            modeisLatLong: false
        };

        if (aiResponseContent) {
            try {
                parsedAiResponse = JSON.parse(aiResponseContent);
            } catch (parseError) {
                console.error('Error parsing aiResponseContent:', parseError);
            }
        }

        const searchEntry = {
            searchId: searchId,
            ip: ip,
            originalQuery: query,
            aiContent: aiContent,
            aiResponseContent: aiResponseContent || "Unknown",
            country: country || "Unknown",
            latitude: latitude || "Unknown",
            longitude: longitude || "Unknown",
            mapsRequest: mapsRequest !== undefined ? mapsRequest : "Unknown",
            resultCount: resultCount !== undefined ? resultCount : "Unknown",
            retryAttempted: retryAttempted,
            userRating: 0,
            timestamp: timestamp,
            isLatLongMode: isLatLongMode
        };
        await searchesCollection.insertOne(searchEntry);

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
                    timestamp: timestamp
                }
            ],
            places: places.map((place, index) => ({
                [index]: place
            }))
        };
        await resultsCollection.insertOne(resultEntry);

    } catch (error) {
        console.error('Error logging search and results:', error);
    } finally {
        await client.close();
    }

    return searchId;
}

async function getCachedResults(query) {
    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const resultsCollection = database.collection('search_results');

        const cachedResults = await resultsCollection.find({
            $or: [
                { originalQuery: { $regex: query, $options: 'i' } },
                { aiQuery: { $regex: query, $options: 'i' } }
            ],
            "data.0.resultCount": { $gte: 5 },  // Ensure at least 5 results
            "data.0.modeisLatLong": false  // Exclude modeisLatLong: true results
        }).sort({ "data.0.timestamp": -1 }).limit(5).toArray();

        console.log("Potential cached results:", JSON.stringify(cachedResults, null, 2));

        for (const result of cachedResults) {
            if (result.places && result.places.length >= 5) {
                console.log("Using cached result:", result.originalQuery);
                const formattedPlaces = result.places.map(place => {
                    const placeData = Object.values(place)[0]; // Get the place data from the object
                    return {
                        ...placeData,
                        name: placeData.displayName?.text || placeData.name || 'Unknown'
                    };
                });
                return {
                    places: formattedPlaces,
                    aiResponse: {
                        aiEmoji: result.data[0].aiEmoji || "🔍",
                        aiType: result.data[0].aiType || "cached",
                        originalQuery: result.originalQuery
                    }
                };
            }
        }
        console.log("No suitable cached results found");
        return null;
    } catch (error) {
        console.error('Error getting cached results:', error);
        return null;
    } finally {
        await client.close();
    }
}


const aiRequest = async (query, country, retryQuery = null) => {
    const isLatLongMode = query.includes('modeisLatLong:') || (country && country.includes('modeisLatLong:'));
    const queryFile = isLatLongMode ? 'latlongQuery.text' : 'regularQuery.txt';
    const queryPrefix = fs.readFileSync(path.join(__dirname, queryFile), 'utf8').trim();
    const fullAiContent = retryQuery || `${queryPrefix} ${country ? `${country} ` : ''} ${query}`;

    console.log("AI Request Content:", fullAiContent);

    try {
        const aiResponse = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GOOGLE_MAPS_API_KEY,
            {
                contents: [
                  {
                    parts: [
                      {
                       text: fullAiContent
                      }
                    ],
                  }
                ]
              },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("AI Response:", aiResponse.data);
        
        if (aiResponse?.data?.candidates && aiResponse.data.candidates.length > 0 && aiResponse.data.candidates[0].content?.parts && aiResponse.data.candidates[0].content.parts.length > 0 && aiResponse.data.candidates[0].content.parts[0].text) {
            const aiResponseText = aiResponse.data.candidates[0].content.parts[0].text.trim();
            try {
                // Remove any potential markdown formatting
                const cleanedResponse = aiResponseText.replace(/```json\n?|\n?```/g, '').trim();
                const parsedResponse = JSON.parse(cleanedResponse);
                
                // Validate the parsed response
                if (!parsedResponse.aiQuery || typeof parsedResponse.aiQuery !== 'string') {
                    throw new Error('Invalid AI response structure: missing or invalid aiQuery');
                }
                
                // Add the modeisLatLong flag to the parsedResponse
                parsedResponse.modeisLatLong = isLatLongMode;
                
                return {
                    aiContent: fullAiContent,
                    aiResponse: parsedResponse
                };
            } catch (parseError) {
                console.error("Error parsing AI response as JSON:", parseError);
                throw new Error('Invalid AI response format');
            }
        } else {
            console.log("No valid response from AI", aiResponse.data);
            throw new Error('No valid response from AI');
        }
    } catch (error) {
        console.error("Error in AI Request:", error.message);
        throw error;
    }
};

const mapsRequest = async (mapsQuery, latitude, longitude, radius) => {
    if (typeof mapsQuery !== 'string') {
        console.error('mapsQuery is not a string:', mapsQuery);
        throw new Error('Invalid mapsQuery: mapsQuery should be a string');
    } 

    const minRating = mapsQuery.toLowerCase().includes("club") ? 4.0 : 4.5;
    const requestPayload = { textQuery: mapsQuery, minRating };

    if (latitude && longitude) {
        requestPayload.locationBias = { circle: { center: { latitude: latitude, longitude: longitude }, radius: parseFloat(radius) } };
    }

    console.log("Maps Request Payload:", requestPayload);

    try {
        const mapsResponse = await axios.post(
            'https://places.googleapis.com/v1/places:searchText',
            requestPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.location'
                }
            }
        );

        console.log("Maps Response:", mapsResponse.data);

        return mapsResponse.data;
    } catch (error) {
        console.error("Error in Maps Request:", error.message);
        throw error;
    }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const addDistanceToPlaces = (places, userLat, userLon) => {
    return places.map(place => ({
        ...place,
        distance: {
            distance: calculateDistance(userLat, userLon, place.location.latitude, place.location.longitude)
        }
    }));
};

const mapsRequestWithDistance = async (mapsQuery, latitude, longitude, radius) => {
    const mapsResponse = await mapsRequest(mapsQuery, latitude, longitude, radius);
    
    if (latitude && longitude && mapsResponse.places) {
        mapsResponse.places = addDistanceToPlaces(mapsResponse.places, latitude, longitude);
    }

    return mapsResponse;
};


const processor = async (mapsResponse, aiQuery, hasLocationInfo, isLatLongMode) => {
    if (!mapsResponse || !mapsResponse.places || mapsResponse.places.length === 0) {
        throw new Error('No places found');
    }

    let filteredPlaces = mapsResponse.places.filter(place => {
        const reviewCount = place.userRatingCount || 0;
        return reviewCount >= 10 && reviewCount <= 1500;
    });

    let sortedPlaces = filteredPlaces.map(place => ({
        ...place,
        name: place.displayName?.text || 'Unknown',
        rating: place.rating || 0,
        userRatingCount: place.userRatingCount || 0,
        distance: place.distance?.distance || Infinity
    }));

    console.log("Before sorting:", sortedPlaces.map(p => ({ name: p.name, distance: p.distance })));
    
    if (isLatLongMode) {
        console.log("Sorting by distance (latlong mode)");
        sortedPlaces.sort((a, b) => a.distance - b.distance);
    } else {
        console.log("Sorting by rating (regular mode)");
        sortedPlaces.sort((a, b) => b.rating - a.rating);
    }

    console.log("After sorting:", sortedPlaces.map(p => ({ name: p.name, distance: p.distance })));

    return sortedPlaces;
};

async function getRecentSearches() {
    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const resultsCollection = database.collection('search_results');

        const recentSearches = await resultsCollection.find({
            "data.0.resultCount": { $gte: 5 },  // Only include searches with 5 or more results
            $or: [
                { "data.0.modeisLatLong": { $ne: true } },  // Include where modeisLatLong is not true
                { "data.0.modeisLatLong": { $exists: false } }  // Include where modeisLatLong doesn't exist
            ]
        })
            .sort({ "data.0.timestamp": -1 })
            .limit(30)  // Increased limit to ensure we have enough unique results
            .toArray();

        console.log("Raw recent searches from DB:", JSON.stringify(recentSearches, null, 2));

        const uniqueSearches = [];
        const seenEmojis = new Set();
        const seenTypes = new Set();

        for (const search of recentSearches) {
            const emoji = search.data[0].aiEmoji;
            const type = search.data[0].aiType;
            const resultCount = search.data[0].resultCount;

            if (!seenEmojis.has(emoji) && !seenTypes.has(type) && resultCount >= 5) {
                uniqueSearches.push({
                    originalQuery: search.originalQuery,
                    aiEmoji: emoji,
                    aiType: type
                });
                seenEmojis.add(emoji);
                seenTypes.add(type);
            }

            if (uniqueSearches.length === 10) break;  // Stop after getting 10 unique searches
        }

        console.log("Formatted unique recent searches:", JSON.stringify(uniqueSearches, null, 2));

        return uniqueSearches;
    } catch (error) {
        console.error('Error getting recent searches:', error);
        return [];
    } finally {
        await client.close();
    }
}

module.exports = async (req, res) => {
    console.log("Incoming request:", req.method, req.query);

    if (req.method === "GET") {
        if (req.query.recentSearches === 'true') {
            try {
                const recentSearches = await getRecentSearches();
                console.log("Sending recent searches:", JSON.stringify(recentSearches, null, 2));
                return res.status(200).json(recentSearches);
            } catch (error) {
                console.error('Error fetching recent searches:', error);
                return res.status(500).json({ error: 'Failed to fetch recent searches' });
            }
        }
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const ip = req.headers["x-forwarded-for"];
        
        const rl = new Ratelimit({
            redis: kv,
            limiter: Ratelimit.slidingWindow(3, '10s')
        });

        const { success, limit, reset, remaining } = await rl.limit(`ratelimit_${ip}`);

        if (!success) {
            console.log("Rate limit exceeded for IP:", ip);
            return res
                .status(429)
                .json({ error: "please be kind to the locals, you need them in your future" })
                .headers({
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString()
                });
        }
    } else {
        console.log("KV_REST_API_URL and KV_REST_API_TOKEN env vars not found, not rate limiting...");
    }

    const { query, latitude, longitude, country, radius } = req.body;
    const isLatLongMode = !!(latitude && longitude);

    if (!query || query.length > 128) {
        console.error("Invalid query length:", query);
        return res.status(400).json({ error: "Invalid query length" });
    }

    async function handleRequest(retry = true, retryQuery = null, isRetryAttempt = false) {
        console.log("Handling request, retry:", retry, "isRetryAttempt:", isRetryAttempt);
        let aiContent, aiResponse, mapsReq;
        
        // Check for cached results only for non-lat/long queries
        if (!isLatLongMode) {
            const cachedResults = await getCachedResults(query);
            if (cachedResults) {
                console.log("Returning cached results");
                return res.status(200).json({ 
                    places: cachedResults.places, 
                    aiResponse: cachedResults.aiResponse,
                    searchId: "cached" 
                });
            }
        }

        try {
            const aiResult = await aiRequest(query, isLatLongMode ? `modeisLatLong:${country || ''}` : country, retryQuery);
            aiContent = aiResult.aiContent;
            aiResponse = aiResult.aiResponse;

            console.log("AI content and response received:", aiContent, aiResponse);

            if (!aiResponse || !aiResponse.aiQuery) {
                throw new Error('Invalid AI response structure');
            }

            const mapsResponse = await mapsRequestWithDistance(aiResponse.aiQuery, latitude, longitude, radius);
            mapsReq = aiResponse.aiQuery;

            const hasLocationInfo = isLatLongMode || !!country;
            const sortedPlaces = await processor(mapsResponse, aiResponse.aiQuery, hasLocationInfo, isLatLongMode);

            const resultCount = sortedPlaces.length;
            const originalQueryTokens = tokenizeAndNormalize(query);
            const retryCondition1 = resultCount === 1 && containsAnyToken(sortedPlaces[0].name, originalQueryTokens);
            const retryCondition2 = resultCount === 0;

            const searchId = await logSearchAndResults(req, query, aiContent, aiResponse ? JSON.stringify(aiResponse) : null, country, latitude, longitude, mapsReq, resultCount, isRetryAttempt, sortedPlaces, isLatLongMode);

            if ((retryCondition1 || retryCondition2) && retry) {
                console.log("Retrying due to no results or only one partial match...");
                const newRetryQuery = `${aiContent} 5. IMPORTANT Your previous response was (${JSON.stringify(aiResponse)}) which gave no results in Google Maps API. Please provide a different query, focusing on the type of place and its characteristics, without mentioning specific locations.`;

                console.log("Retrying with query:", newRetryQuery);
                return await handleRequest(false, newRetryQuery, true);
            }

            return res.status(200).json({ 
                places: sortedPlaces, 
                aiResponse: {
                    ...aiResponse,
                    modeisLatLong: isLatLongMode.toString()
                },
                searchId: searchId
            });
        } catch (error) {
            console.error('Error in handleRequest:', error.message);
            if ((error.message === 'No places found' || error.message.includes('Invalid AI response')) && retry) {
                console.log("Retrying due to error:", error.message);
                const newRetryQuery = `${aiContent} 5. IMPORTANT Your previous response was invalid or gave no results. Please provide a different query, focusing on the type of place and its characteristics, without mentioning specific locations. Ensure your response is a valid JSON object.`;

                console.log("Retrying with query:", newRetryQuery);
                return await handleRequest(false, newRetryQuery, true);
            }
            const searchId = await logSearchAndResults(req, query, aiContent, aiResponse ? JSON.stringify(aiResponse) : null, country, latitude, longitude, mapsReq, 0, isRetryAttempt, [], isLatLongMode);
            return res.status(500).json({ error: error.message || 'Unknown error', searchId: searchId });
        }
    }

    function tokenizeAndNormalize(text) {
        const stopWords = new Set(['the', 'in', 'and', 'of', 'a', 'to', 'is', 'it', 'with', 'for', 'on', 'that', 'this', 'at', 'by', 'an', 'be', 'as', 'from', 'or', 'are', 'was', 'but', 'not', 'have', 'has', 'had', 'which', 'you', 'we', 'they', 'i', 'he', 'she', 'him', 'her', 'them', 'us', 'our', 'your', 'their', 'its', 'my', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs']);
        return text.toLowerCase().split(/\s+/).filter(word => !stopWords.has(word));
    }

    function containsAnyToken(text, tokens) {
        const lowerText = text.toLowerCase();
        return tokens.some(token => lowerText.includes(token));
    }

    return await handleRequest();
};