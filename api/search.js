const fs = require('fs');
const path = require('path');
const axios = require('axios');

const preprocess = async (userQuery, latitude, longitude) => {
    const mapsQuery = await aiRequest(userQuery, latitude, longitude);
    return mapsQuery;
};


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
        const mapsQuery = aiResponse.data.choices[0].message.content.trim();
        if (mapsQuery.toLowerCase().includes('maps')) {
            throw new Error("🦈 Ha! You might be entering nonsense.");
        }
        return mapsQuery;
    } else {
        throw new Error('No valid response from AI');
    }
};

const mapsRequest = async (mapsQuery) => {
    let minRating = 4.5;
    if (mapsQuery.toLowerCase().includes("club")) {
        minRating = 4.0;
    }

    const mapsResponse = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
            textQuery: mapsQuery,
            minRating: minRating
        },
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
    const numPlaces = mapsResponse && mapsResponse.places ? mapsResponse.places.length : 0;

    if (numPlaces === 1 && mapsQuery.toLowerCase().includes('hidden')) {
        const modifiedQuery = mapsQuery.replace('hidden', '');
        const modifiedPlaces = await mapsRequest(modifiedQuery);
        return await processor(modifiedPlaces, modifiedQuery);
    }

    if (mapsResponse && mapsResponse.places && mapsResponse.places.length === 1) {
        const placeName = mapsResponse.places[0].displayName.text.toLowerCase();
        const aiResponseWords = mapsQuery.split('+');
        const hasHit = aiResponseWords.some(word => placeName.includes(word));
        if (hasHit) {
            throw new Error("Error alert: AI response word found in place name");
        }
    }

    if (mapsResponse && mapsResponse.places) {
        const filteredPlaces = mapsResponse.places.filter(place => place.userRatingCount > 15 && place.userRatingCount < 1500);
        const sortedPlaces = filteredPlaces.sort((a, b) => b.rating - a.rating).slice(0, 30);
        return sortedPlaces;
    } else {
        throw new Error('No places found');
    }
};

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { query, latitude, longitude, staticMode } = req.body;
    if (!query || query.length > 128) {
        return res.status(400).json({ error: "Invalid query length" });
    }

    try {
        let mapsQuery;
        try {
            if (staticMode) {
                // Handle static mode if needed
            } else {
                mapsQuery = await preprocess(query, latitude, longitude);
            }

            const places = await mapsRequest(mapsQuery);
            const sortedPlaces = await processor(places, mapsQuery);

            return res.status(200).json({ places: sortedPlaces, aiResponse: mapsQuery });
        } catch (error) {
            res.status(400).json({ error: error.message, aiResponse: mapsQuery });
            return;
        }
    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
