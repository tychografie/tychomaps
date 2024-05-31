
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { log } = require('console');


const preprocess = async (userQuery) => {
    // clean incoming data from user first


    // when finalized user input, do AI request
    const mapsQuery = await aiRequest(userQuery)

    // check AI mapsQuery, possibly incorrect, then do another preprocess() call with modified user query

    // const newInput = await aiRequest("aangepaste user input")

    // final query:
    return mapsQuery
}



const aiRequest = async (query, locateMe) => {
    // Read the query prefix from a separate file
    const queryPrefix = fs.readFileSync(path.join(__dirname, 'chatgptquery.txt'), 'utf8').trim();

    let latitude = '';
    let longitude = '';

    if (typeof locatorUsed === 'undefined') {
        throw new Error("locator is undefined.");
    } else if (locatorUsed === true) {
        throw new Error("locator is used.");
    }



    const aiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: `${queryPrefix} ${query} ${latitude} ${longitude}`
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

            // res.status(404).json({ error: '🦈 Ha! You might be entering nonsense.' });
            // return;
        }
        return mapsQuery


    } else {
        throw new Error('No valid response from AI')
        // res.status(500).json({ error: 'No valid response from AI' });
    }
}


/**
 * 
 * @param {*} aiResponse 
 * @returns data with {places}
 */

const mapsRequest = async (mapsQuery) => {
    let minRating = 4.5
    if (mapsQuery.toLowerCase().includes("club")) {
        minRating = 4.0
        //     mapsQuery = mapsQuery.replace("dit","data")
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

    return mapsResponse.data
}

/**
 * 
 * @param {*} mapsResponse 
 * @param {*} mapsQuery 
 * @returns sortedPlaces[]
 */
const processor = async (mapsResponse, mapsQuery) => {

    const numPlaces = mapsResponse && mapsResponse.places ? mapsResponse.places.length : 0;

    if (numPlaces === 1 && mapsQuery.toLowerCase().includes('hidden')) {
        const modifiedQuery = mapsQuery.replace('hidden', '');
        const modifiedPlaces = await mapsRequest(modifiedQuery);
        log('Modified query:', modifiedQuery);
        return await processor(modifiedPlaces, modifiedQuery);
    
    }


    if (mapsResponse && mapsResponse.places && mapsResponse.places.length ===    1) {
        const placeName = mapsResponse.places[0].displayName.text.toLowerCase();

        const aiResponseWords = mapsQuery.split('+');

        const hasHit = aiResponseWords.some(word => placeName.includes(word));
        if (hasHit) {
            throw new Error("Error alert: AI response word found in place name")
            // res.status(400).json({ error: 'Error alert: AI response word found in place name' });
            // return;
        }
    }
    console.log(JSON.stringify(mapsResponse))
    if (mapsResponse && mapsResponse.places) {
        const filteredPlaces = mapsResponse.places.filter(place => place.userRatingCount > 15 && place.userRatingCount < 1500);
        const sortedPlaces = filteredPlaces.sort((a, b) => b.rating - a.rating).slice(0, 30);

        return sortedPlaces

    } else {
        // const aiquery = await aiRequest("een+aangepaste+query+met+andere+woorden")
        // const mapsPlaces = await mapsRequest("een+aangepaste+query+met+andere+woorden")

        // return await processor(mapsPlaces, mapsQuery)

        throw new Error('No places found')
        // res.status(404).json({ error: 'No places found', aiResponse: aiResponse.data.choices[0].message.content });
    }
}


module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { query, staticMode } = req.body;
    if (!query || query.length > 128) {
        return res.status(400).json({ error: "Invalid query length" });
    }

    try {


        // if (staticMode) {
        //     // return
        //     const staticData = JSON.parse(fs.readFileSync(path.join(__dirname, 'staticData.json'), 'utf8'));

        //     return await processor(staticData)

        //     // return res.status(200).json(staticData);
        // }

        let mapsQuery;
        try {

            // mapsQuery = await aiRequest(query) // throws error if maps
            if (staticMode) {
            //     mapsQuery = "utrecht+koffie+gezellig"

            //     const placesTester = await mapsRequest(mapsQuery)
                // const placesTester = {
                //     "places": [
                //         {
                //             "rating": 4.9,
                //             "googleMapsUri": "https://maps.google.com/?cid=14960975664163707840",
                //             "userRatingCount": 1323,
                //             "displayName": {
                //                 "text": "Pampalini Lunchroom & Coffee - Utrecht",
                //                 "languageCode": "en"
                //             }
                //         }
                //     ],
                //     "aiResponse": ""
                // }
                const sortedPlaces = await processor(placesTester, mapsQuery);

                return res.status(200).json({ places: sortedPlaces, aiResponse: mapsQuery })


            } else {
            }
            mapsQuery = await preprocess(query)

            const places = await mapsRequest(mapsQuery)

            const sortedPlaces = await processor(places, mapsQuery);

            return res.status(200).json({ places: sortedPlaces, aiResponse: mapsQuery })

        } catch (error) {
            res.status(400).json({ error: error.message, aiResponse: mapsQuery })
            return;
        }


    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
