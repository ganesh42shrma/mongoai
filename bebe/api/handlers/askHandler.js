const { detectQueryType, handleInsightRequest, askMongoQuery, askAnswerSummary } = require('../../lib/utils');
const { runMongoQuery } = require('../../lib/db');
const logger = require('../../lib/logger');
const { supabase } = require('../../lib/utils');


module.exports = async (req, res) => {
 try {
   const { question, collection } = req.body;
   if (!question || !collection) {
     return res.status(400).json({ error: 'Missing required parameters' });
   }


   const userId = req.user.id;
   // Fetch config from Supabase
   const { data, error } = await supabase
     .from('user_configs')
     .select('db_uri, db_name')
     .eq('user_id', userId)
     .single();


   if (error || !data) {
     return res.status(400).json({ error: 'No config found for user' });
   }
   const dbUri = data.db_uri;
   const dbName = data.db_name;


   logger.info(`Processing question: ${question}`);
   logger.info(`Target collection: ${collection}`);


   // Detect query type
   logger.info('Detecting query type...');
   const queryType = await detectQueryType(question);
   logger.info(`Query type: ${queryType}`);


   if (queryType.type === 'insight') {
     logger.info('Generating insights...');
     const result = await handleInsightRequest(question, collection, dbUri, dbName);
     return res.json(result);
   }


   // Handle regular query
   logger.info('Generating MongoDB query...');
   const rawQuery = await askMongoQuery(question, collection, dbUri, dbName);
   const { reasoning, query } = extractReasoningAndQuery(rawQuery);
  
   if (!query) {
     return res.status(422).json({ error: 'Failed to generate valid MongoDB query' });
   }


   const result = await runMongoQuery(query, dbUri, dbName);
   const summary = await askAnswerSummary(question, result);


   res.json({
     type: 'query',
     reasoning,
     query: JSON.parse(query),
     result,
     summary
   });
 } catch (err) {
   logger.error(`Error processing question: ${err.message}`);
   res.status(500).json({ error: err.message });
 }
};

