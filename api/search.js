const axios = require('axios');
const fs = require('fs');
const path = require('path');

function logSearch(query, mapsQuery, numPlaces) {
    const filePath = path.join(__dirname, 'searchLogs.json');
    const data = {
        query,
        mapsQuery,
        numPlaces,
        timestamp: new Date()
    };

    fs.readFile(filePath, (err, content) => {
        let searches = [];
        if (!err && content.length > 0) {
            searches = JSON.parse(content.toString());
        }
        searches.push(data);
        fs.writeFile(filePath, JSON.stringify(searches, null, 2), err => {
            if (err) {
                console.error('Error writing to file', err);
            }
        });
    });
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { query } = req.body;
    if (!query || query.length > 128) {
        return res.status(400).json({ error: "Invalid query length" });
    }

    try {
        // Read the query prefix from a separate file
        const queryPrefix = fs.readFileSync(path.join(__dirname, 'chatgptquery.txt'), 'utf8').trim();

        const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `${queryPrefix} ${query}`
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

            const mapsResponse = await axios.post(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    textQuery: mapsQuery,
                    minRating: 4.5
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                        'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.googleMapsUri'
                    }
                }
            );

            const numPlaces = mapsResponse.data && mapsResponse.data.places ? mapsResponse.data.places.length : 0;

            logSearch(query, mapsQuery, numPlaces);

            if (mapsResponse.data && mapsResponse.data.places) {
                const filteredPlaces = mapsResponse.data.places.filter(place => place.userRatingCount > 15 && place.userRatingCount < 1500);
                const sortedPlaces = filteredPlaces.sort((a, b) => b.rating - a.rating).slice(0, 5);
                res.status(200).json({ places: sortedPlaces });
            } else {
                res.status(404).json({ error: 'No places found' });
            }
        } else {
            res.status(500).json({ error: 'No valid response from AI' });
        }
    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
