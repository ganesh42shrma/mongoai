const express = require('express');
const cors = require('cors');
const healthHandler = require('./handlers/healthHandler');
const collectionsHandler = require('./handlers/collectionsHandler');
const askHandler = require('./handlers/askHandler');
const saveModelConfigHandler = require('./handlers/saveModelConfigHandler');
const getModelConfigHandler = require('./handlers/getModelConfigHandler');
const deleteModelConfigHandler = require('./handlers/deleteModelConfigHandler');
const suggestPromptsHandler = require('./handlers/suggestPromptsHandler');
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
app.get('/suggest-prompts', authenticateToken, (req, res, next) => suggestPromptsHandler(req, res).catch(next));


// Model Configuration Routes
app.get('/model-config', authenticateToken, (req, res, next) => getModelConfigHandler(req, res).catch(next));
app.post('/model-config', authenticateToken, (req, res, next) => saveModelConfigHandler(req, res).catch(next));
app.delete('/model-config/:name', authenticateToken, (req, res, next) => deleteModelConfigHandler(req, res).catch(next));


// Global error handler
app.use((err, req, res, next) => {
 logger.error(err.stack);
 res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 logger.info(`Server running on port ${PORT}`);
});






