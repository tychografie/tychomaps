const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config(); // Voor omgevingsvariabelen
const mapsRequestsHandler = require('./mapsRequests'); // Zorg dat het pad correct is

app.use('/', mapsRequestsHandler);

const locateHandler = require('./locate'); // Zorg ervoor dat dit pad correct is
const searchHandler = require('./search'); // Zorg ervoor dat dit pad correct is

app.use(express.json()); // Middleware om JSON-bodies te parseren

const PORT = process.env.PORT || 3000; // De poort waar de server naar luistert

// Serve the last query
app.get('/api/last-query', (req, res) => {
    const filePath = path.join(__dirname, 'searchLogs.json');
    fs.readFile(filePath, (err, content) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read log file' });
        }
        const searches = JSON.parse(content.toString());
        const lastQuery = searches[searches.length - 1]; // Get the last query
        res.json(lastQuery);
    });
});

// Voeg de locate route toe
app.get('/api/locate', locateHandler);

// Voeg de search route toe
app.post('/api/search', searchHandler);

// Start de server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
