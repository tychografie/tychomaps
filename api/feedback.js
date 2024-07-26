const { MongoClient, ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');

        if (req.method === "POST") {
            const { rating, id, feedbackHandled } = req.body;

            if (rating !== undefined) {
                // Handle feedback rating
                if (rating !== 1 && rating !== -1) {
                    return res.status(400).json({ error: "Invalid rating" });
                }

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
                    return res.status(200).json({ message: "Feedback recorded successfully" });
                } else {
                    return res.status(404).json({ error: "No recent search found" });
                }
            } else if (id !== undefined && feedbackHandled !== undefined) {
                // Handle feedbackHandled status update
                if (typeof feedbackHandled !== 'boolean') {
                    return res.status(400).json({ error: "Invalid feedbackHandled value" });
                }

                await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { feedbackHandled: feedbackHandled ? 1 : 0 } }
                );
                return res.status(200).json({ message: "Feedback handled status updated successfully" });
            } else {
                return res.status(400).json({ error: "Invalid request body" });
            }
        } else if (req.method === "GET") {
            const { rating } = req.query;
            if (rating !== '1' && rating !== '-1') {
                return res.status(400).json({ error: "Invalid rating value" });
            }
            
            const userRating = parseInt(rating);
            const feedback = await collection.aggregate([
                {
                    $match: {
                        $or: [
                            { userRating: userRating },
                            { resultCount: 0 }
                        ]
                    }
                },
                { $sort: { timestamp: -1 } }
            ]).toArray();

            return res.status(200).json(feedback);
        } else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        console.error('Error handling feedback:', error);
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
};
