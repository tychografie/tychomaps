const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

// Configureer je MongoDB connectie
const url = process.env.MONGODB_URI; // Zorg dat je .env bestand de juiste URL bevat
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

router.get('/api/mapsRequests', async (req, res) => {
    try {
        await client.connect();
        const db = client.db('tychomapsmongodb'); // Zorg dat de database naam correct is
        const usersCount = await db.collection('searches').aggregate([
            { $group: { _id: '$ip' } },
            { $group: { _id: null, count: { $sum: 1 } } }
        ], { maxTimeMS: 60000, allowDiskUse: true }).toArray();

        const totalUsers = usersCount.length > 0 ? usersCount[0].count : 0;

        const result = await db.collection('searches').aggregate([
            {
                $group: {
                    _id: null,
                    totalMapsRequests: {
                        $sum: '$mapsRequest'
                    }
                }
            }
        ]).toArray();

        if (result.length > 0) {
            res.json({ totalMapsRequests: result[0].totalMapsRequests, totalUsers: totalUsers });
        } else {
            res.json({ totalMapsRequests: 0 });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving map requests');
    } finally {
        await client.close();
    }
});

module.exports = router;