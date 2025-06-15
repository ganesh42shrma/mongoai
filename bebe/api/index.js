const express = require('express');
const cors = require('cors');
const healthHandler = require('./handlers/healthHandler');
const collectionsHandler = require('./handlers/collectionsHandler');
const askHandler = require('./handlers/askHandler');
const authenticateToken = require('../middleware/auth');
require('dotenv').config();


const app = express();
const logger = require('../lib/logger');


// Enable CORS for all routes
app.use(cors({
 origin: 'http://localhost:5173', // Adjust as needed for production
 credentials: true,
}));


app.use(express.json());


// Use handlers
app.get('/health', authenticateToken, (req, res, next) => healthHandler(req, res).catch(next));
app.post('/collections', authenticateToken, (req, res, next) => collectionsHandler(req, res).catch(next));
app.post('/ask', authenticateToken, (req, res, next) => askHandler(req, res).catch(next));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 logger.info(`Server running on port ${PORT}`);
});

