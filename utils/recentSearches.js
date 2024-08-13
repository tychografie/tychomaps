const { MongoClient } = require('mongodb');

async function getRecentSearches() {
    const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const resultsCollection = database.collection('search_results');

        const recentSearches = await resultsCollection.aggregate([
            {
                $match: {
                    "data.0.resultCount": { $gte: 5 },
                    "data.0.modeisLatLong": false
                }
            },
            {
                $sort: { "data.0.timestamp": -1 }
            },
            {
                $limit: 100
            },
            {
                $project: {
                    originalQuery: 1,
                    aiEmoji: "$data.0.aiEmoji",
                    aiType: "$data.0.aiType",
                    resultCount: "$data.0.resultCount"
                }
            }
        ]).toArray();

        const uniqueSearches = [];
        const seenEmojis = new Set();
        const seenTypes = new Set();

        for (const search of recentSearches) {
            if (!seenEmojis.has(search.aiEmoji) && !seenTypes.has(search.aiType) && uniqueSearches.length < 10) {
                uniqueSearches.push({
                    originalQuery: search.originalQuery,
                    aiEmoji: search.aiEmoji,
                    aiType: search.aiType
                });
                seenEmojis.add(search.aiEmoji);
                seenTypes.add(search.aiType);
            }
        }

        return uniqueSearches;
    } finally {
        await client.close();
    }
}

module.exports = { getRecentSearches };