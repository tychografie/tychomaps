const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function logDetails(req, query, aiResponse, mapsRequest, resultCount) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const coordinatesPresent = req.body.latitude && req.body.longitude;

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');
        const logEntry = {
            ip: ip,
            query: query,
            coordinatesPresent: coordinatesPresent,
            aiResponse: aiResponse,
            resultCount: resultCount,
            timestamp: new Date()
        };
        await collection.insertOne(logEntry);
    } catch (error) {
        console.error('Error logging details:', error);
    } finally {
        await client.close();
    }
}

const aiRequest = async (query, latitude, longitude) => {
    const queryPrefix = fs.readFileSync(path.join(__dirname, 'chatgptquery.txt'), 'utf8').trim();
    const aiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: `${queryPrefix} ${query} ${latitude ? latitude : ''} ${longitude ? longitude : ''}`
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
        return aiResponse.data.choices[0].message.content.trim();
    } else {
        throw new Error('No valid response from AI');
    }
};

const mapsRequest = async (mapsQuery, lat, lon) => {
    const minRating = mapsQuery.toLowerCase().includes("club") ? 4.0 : 4.5;
    const requestPayload = { textQuery: mapsQuery, minRating };

    if (lat && lon) {
        requestPayload.locationBias = { circle: { center: { latitude: lat, longitude: lon }, radius: 500.0 } };
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

    const { query, latitude, longitude } = req.body;
    if (!query || query.length > 128) {
        res.status(400).json({ error: "Invalid query length" });
        return;
    }

    try {
        const aiResponse = await aiRequest(query, latitude, longitude);
        const mapsResponse = await mapsRequest(aiResponse, latitude, longitude);
        const sortedPlaces = await processor(mapsResponse, aiResponse);

        await logDetails(req, query, aiResponse, mapsResponse, sortedPlaces.length);
        res.status(200).json({ places: sortedPlaces, aiResponse: aiResponse });
    } catch (error) {
        await logDetails(req, query, null, null, 0);
        res.status(500).json({ error: error.message });
    }
};
