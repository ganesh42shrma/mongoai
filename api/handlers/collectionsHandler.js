const { listCollections } = require('../../lib/db');
const logger = require('../../lib/logger');

module.exports = async (req, res) => {
  try {
    const { dbUri, dbName } = req.body;
    if (!dbUri || !dbName) {
      return res.status(400).json({ error: 'Missing dbUri or dbName in request body' });
    }
    logger.info(`Listing collections for database: ${dbName}`);
    const collections = await listCollections(dbUri, dbName);
    res.json({ collections });
  } catch (err) {
    logger.error(`Collection listing error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};