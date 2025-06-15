const express = require('express');
const healthHandler = require('./handlers/healthHandler');
const collectionsHandler = require('./handlers/collectionsHandler');
const askHandler = require('./handlers/askHandler');
require('dotenv').config();

const app = express();
const logger = require('../lib/logger');

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Use handlers
app.get('/health', healthHandler);
app.post('/collections', collectionsHandler);
app.post('/ask', askHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});