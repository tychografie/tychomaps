const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { rating } = req.body;
    if (rating !== 1 && rating !== -1) {
        return res.status(400).json({ error: "Invalid rating" });
    }

    const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');

        // Find the most recent search for this user's IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const mostRecentSearch = await collection.findOne(
            { ip: ip },
            { sort: { timestamp: -1 } }
        );

        if (mostRecentSearch) {
            await collection.updateOne(
                { _id: mostRecentSearch._id },
                { $set: { userRating: rating } }
            );
            res.status(200).json({ message: "Feedback recorded successfully" });
        } else {
            res.status(404).json({ error: "No recent search found" });
        }
    } catch (error) {
        console.error('Error recording feedback:', error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
};