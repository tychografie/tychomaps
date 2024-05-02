const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();


app.use(express.json()); // Middleware to parse JSON bodies

const PORT = 3000; // The port the server will listen on

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
