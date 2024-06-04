
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { kv } = require("@vercel/kv");
const { RateLimit } = require("@upstash/ratelimit");

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function logDetails(req, query, aiResponseContent, aiContent, country, latitude, longitude, mapsRequest, resultCount) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');
        const logEntry = {
            ip: ip,
            query: query,
            country: country || "Unknown",
            latitude: latitude || "Unknown",
            longitude: longitude || "Unknown",
            mapsRequest: mapsRequest || "Unknown",
            aiResponseContent: aiResponseContent || "Unknown",
            resultCount: resultCount !== undefined ? resultCount : "Unknown",
            timestamp: new Date()
        };
        await collection.insertOne(logEntry);
    } catch (error) {
        console.error('Error logging details:', error);
    } finally {
        await client.close();
    }
}

const aiRequest = async (query, country) => {
    const queryPrefix = fs.readFileSync(path.join(__dirname, 'chatgptquery.txt'), 'utf8').trim();
    const fullAiContent = `${queryPrefix} ${country ? `modeisLatLong:${country} ` : ''} ${query}`; // This is what you're actually sending to OpenAI

    const aiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: fullAiContent
            }],
            temperature: 0.7
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (aiResponse.data.choices && aiResponse.data.choices.length > 0) {
        return {
            aiContent: fullAiContent, // Return both the AI content sent and the response
            aiResponse: aiResponse.data.choices[0].message.content.trim()
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
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 30);
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
        const ip = req.headers.get('x-forwarded-for')
        const rl = new RateLimit({
            redis: kv,
            // rate limit to 3 requests per 10 seconds
            limiter: RateLimit.slidingWindow(3, '10s')
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

    const handleRequest = async () => {
        try {
            const { aiContent, aiResponse } = await aiRequest(query, country); // Destructure to get both values
            const mapsResponse = await mapsRequest(aiResponse, latitude, longitude);
            const sortedPlaces = await processor(mapsResponse, aiResponse);

            // Check if rerun is needed
            if (sortedPlaces.length === 1) {
                return await handleRequest(); // Rerun the entire request
            }

            await logDetails(req, query, aiContent, country, latitude, longitude, aiResponse, sortedPlaces.length);
            return res.status(200).json({ places: sortedPlaces, aiResponse: aiResponse });
        } catch (error) {
            await logDetails(req, query, null, country, latitude, longitude, null, 0);
            return res.status(500).json({ error: error.message });
        }
    };



    return await handleRequest(); // Initial call to handle the request
};