const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();

console.log("Server is starting...");

// Adjust paths to reflect the correct location of your API handler files
const mapsRequestsHandler = require('./api/mapsRequests');
const locateHandler = require('./api/locate');
const searchHandler = require('./api/search');
const imagesHandler = require('./api/images');

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'))

// API Routes
app.get('/api/mapsRequests', mapsRequestsHandler);
app.get('/api/locate', locateHandler);
app.post('/api/search', searchHandler);
app.get('/api/images', imagesHandler);

app.get('/api/last-query', (req, res) => {
  const filePath = path.join(__dirname, 'api/searchLogs.json'); // Ensure path to searchLogs.json is correct
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error("Failed to read log file:", err);
      return res.status(500).json({ error: 'Failed to read log file' });
    }
    const searches = JSON.parse(content.toString());
    const lastQuery = searches[searches.length - 1];
    res.json(lastQuery);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
