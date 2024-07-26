const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');

app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        req.session.loggedIn = true;
        res.status(200).json({ message: 'Logged in successfully' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

function checkAuth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Apply the checkAuth middleware to the feedback route
app.use('/api/feedback', checkAuth);

// Your existing feedback API routes
app.use('/api/feedback', require('./feedback'));

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
