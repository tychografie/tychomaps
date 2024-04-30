const axios = require('axios');


module.exports = async (req, res) => {
    const { query } = req.body;
    try {
        // Updated OpenAI API Call using the chat model. Test.
        const aiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",  // Change to the specific chat model you are using
                messages: [{role: "user", content: `Process this query for local recommendations: ${query}`}],
                temperature: 0.7  // Adjust temperature if necessary for randomness in response
            },
            { 
                headers: { 
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Check if the response from AI contains choices
        if (aiResponse.data.choices && aiResponse.data.choices.length > 0) {
            const mapsQuery = aiResponse.data.choices[0].message.content.trim();

            // Google Maps Places API Call
            const mapsResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/place/textsearch/json`,
                { params: { query: mapsQuery, key: process.env.GOOGLE_MAPS_API_KEY }}
            );

            res.status(200).json(mapsResponse.data);
        } else {
            // Handle case where no valid response is received from the AI
            res.status(500).json({ error: 'No valid response from AI' });
        }
    } catch (error) {
        console.error('API request failed:', error);
        if (error.response) {
            // Send specific error message and status code from the API response
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            // Fallback error response
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
