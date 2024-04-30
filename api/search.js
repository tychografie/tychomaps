// api/search.js
const axios = require('axios');

module.exports = async (req, res) => {
    const { query } = req.body;
    try {
        // OpenAI API Call
        const aiResponse = await axios.post(
            'https://api.openai.com/v1/engines/davinci-codex/completions',
            {
                prompt: `Process this query for local recommendations: ${query}`,
                max_tokens: 150
            },
            { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }}
        );

        // Process the AI response to form a Google Maps query
        const mapsQuery = aiResponse.data.choices[0].text.trim();

        // Google Maps Places API Call
        const mapsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/textsearch/json`,
            { params: { query: mapsQuery, key: process.env.GOOGLE_MAPS_API_KEY }}
        );

        res.status(200).json(mapsResponse.data);
    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};