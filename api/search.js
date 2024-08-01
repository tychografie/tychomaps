const { Ratelimit } = require("@upstash/ratelimit");
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { kv } = require("@vercel/kv");

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function logDetails(req, query, aiContent, aiResponseContent, country, latitude, longitude, mapsRequest, resultCount, retryAttempted) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');
        const logEntry = {
            ip: ip,
            query: query,
            aiContent: aiContent,
            aiResponseContent: aiResponseContent || "Unknown",
            country: country || "Unknown",
            latitude: latitude || "Unknown",
            longitude: longitude || "Unknown",
            mapsRequest: mapsRequest || "Unknown",
            resultCount: resultCount !== undefined ? resultCount : "Unknown",
            retryAttempted: retryAttempted,
            userRating: 0,
            timestamp: new Date()
        };
        await collection.insertOne(logEntry);
    } catch (error) {
        console.error('Error logging details:', error);
    } finally {
        await client.close();
    }
}

const aiRequest = async (query, country, retryQuery = null) => {
    const queryPrefix = fs.readFileSync(path.join(__dirname, 'chatgptquery.txt'), 'utf8').trim();
    const fullAiContent = retryQuery || `${queryPrefix} ${country ? `modeisLatLong:${country} ` : ''} ${query}`;

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
    if (aiResponse?.data?.candidates && aiResponse.data.candidates.length > 0 && aiResponse.data.candidates[0].content?.parts && aiResponse.data.candidates[0].content.parts.length > 0 && aiResponse.data.candidates[0].content.parts[0].text) {
        return {
            aiContent: fullAiContent,
            aiResponse: aiResponse.data.candidates[0].content.parts[0].text.trim()
        };
    } else {
        throw new Error('No valid response from AI');
    }
};

const mapsRequest = async (mapsQuery, latitude, longitude) => {
    const minRating = mapsQuery.toLowerCase().includes("club") ? 4.0 : 4.5;
    const requestPayload = { textQuery: mapsQuery, minRating };

    if (latitude && longitude) {
        requestPayload.locationBias = { circle: { center: { latitude: latitude, longitude: longitude }, radius: 500.0 } };
    }

    const mapsResponse = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        requestPayload,
        {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.googleMapsUri'
            }
        }
    );
    return mapsResponse.data;
};

const processor = async (mapsResponse, mapsQuery) => {
    const numPlaces = mapsResponse.places ? mapsResponse.places.length : 0;
    if (numPlaces > 0) {
        return mapsResponse.places.filter(place => place.userRatingCount > 15 && place.userRatingCount < 1500)
            .sort((a, b) => b.rating - a.rating);
    } else {
        throw new Error('No places found');
    }
};

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const ip = req.headers["x-forwarded-for"];
        
        const rl = new Ratelimit({
            redis: kv,
            limiter: Ratelimit.slidingWindow(3, '10s')
        })

        const { success, limit, reset, remaining } = await rl.limit(
            `ratelimit_${ip}`
        )

        if (!success) {
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
        console.log("KV_REST_API_URL and KV_REST_API_TOKEN env vars not found, not rate limiting...")
    }

    const { query, latitude, longitude, country } = req.body;
    if (!query || query.length > 128) {
        res.status(400).json({ error: "Invalid query length" });
        return;
    }

    const handleRequest = async (retry = true) => {
        try {
            const { aiContent, aiResponse } = await aiRequest(query, country);
            const mapsResponse = await mapsRequest(aiResponse, latitude, longitude);
            const sortedPlaces = await processor(mapsResponse, aiResponse);
    
            await logDetails(req, query, aiContent, aiResponse, country, latitude, longitude, aiResponse, sortedPlaces.length, !retry);
    
            if (sortedPlaces.length === 0 && retry) {
                console.log("No results found, retrying...");
                const retryQuery = `${query} Do not return: ${aiResponse}`;
                return await handleRequest(false, retryQuery);
            }
    
            return res.status(200).json({ places: sortedPlaces, aiResponse: aiResponse });
        } catch (error) {
            console.error('Error in handleRequest:', error);
            // aiContent is not available in this context
            // await logDetails(req, query, aiContent, aiResponse, country, latitude, longitude, aiResponse, 0, !retry);
            return res.status(500).json({ error: error.message ?? error });
        }
    };

    return await handleRequest();
};