const { MongoClient, ObjectId } = require('mongodb');
const { validateToken } = require('./lib/auth');

module.exports = async (req, res) => {
    if (!req.headers["authorization"]) {
        res.status(401).json({});
        return;
    } else {
        const token = req.headers["authorization"].split("Bearer ")[1];
        console.log(token);
        if (!token) return res.status(401).json({ error: "Invalid Token" });
        if (!validateToken(token)) {
            return res.status(401).json({ error: "Invalid Token" });
        }
    }

    const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('tychomapsmongodb');
        const collection = database.collection('searches');

        if (req.method === "POST") {
            const { rating, id, feedbackHandled } = req.body;

            if (rating !== undefined) {
                if (rating !== 1 && rating !== -1) {
                    return res.status(400).json({ error: "Invalid rating" });
                }

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
            const { rating, resultCountFilter } = req.query;

            let query = {};
            if (rating) {
                const ratings = rating.split(',').map(Number);
                query.userRating = { $in: ratings };
            }

            if (resultCountFilter) {
                let resultCountQuery;
                switch (resultCountFilter) {
                    case '0':
                        resultCountQuery = 0;
                        break;
                    case '0-1':
                        resultCountQuery = { $lte: 1 };
                        break;
                    case '2-5':
                        resultCountQuery = { $gte: 2, $lte: 5 };
                        break;
                    case '5+':
                        resultCountQuery = { $gte: 5 };
                        break;
                    default:
                        break;
                }
                query.resultCount = resultCountQuery;
            }

            const feedback = await collection.find(query)
                .sort({ timestamp: -1 })
                .project({
                    _id: 1,
                    originalQuery: 1,
                    userRating: 1,
                    resultCount: 1,
                    timestamp: 1,
                    feedbackHandled: 1,
                    mapsRequest: 1
                })
                .toArray();
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