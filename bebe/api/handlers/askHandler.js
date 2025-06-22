const { detectQueryType, handleInsightRequest, askMongoQuery, askAnswerSummary, extractReasoningAndQuery, findObjectIds } = require('../../lib/utils');
const { runMongoQuery, findDocumentsByIds } = require('../../lib/db');
const logger = require('../../lib/logger');
const { supabase } = require('../../lib/utils');
const cache = require('../../lib/cache');
const { getCollectionSchema, getEmbeddings, getVectorSearchResult, askLLM } = require('../../lib/llm');


module.exports = async (req, res) => {
 try {
   const { question, collection: collectionName, configName } = req.body;
   console.log(`Received request for collection: ${collectionName} with question: "${question}" using config: "${configName}"`);


   if (!question || !collectionName || !configName) {
     return res.status(400).json({ error: 'Missing required parameters: question, collection, and configName are required.' });
   }


   const userId = req.user.id;


   // Fetch DB config from Supabase
   const { data: dbData, error: dbError } = await supabase
     .from('user_configs')
     .select('db_uri, db_name')
     .eq('user_id', userId)
     .single();


   if (dbError) throw dbError;
   if (!dbData) return res.status(404).json({ error: 'Database configuration not found.' });
   const { db_uri: dbUri, db_name: dbName } = dbData;


   // Fetch *specific* LLM config from Supabase
   const { data: llmData, error: llmError } = await supabase
     .from('user_llm_configs')
     .select('provider, api_key')
     .eq('user_id', userId)
     .eq('config_name', configName)
     .single();


   if (llmError) {
     logger.error(`[askHandler] Error fetching LLM config '${configName}': ${llmError.message}`);
     if (llmError.code === 'PGRST116') {
       return res.status(404).json({
         error: `LLM configuration '${configName}' not found. It may have been deleted.`,
         configNotFound: true
       });
     }
     return res.status(500).json({ error: "Failed to fetch LLM configuration" });
   }
  
   if (!llmData) {
     return res.status(404).json({
       error: `LLM configuration '${configName}' not found. Please select a different model or configure a new API key.`,
       configNotFound: true
     });
   }


   const { provider: llmProvider, api_key: llmApiKey } = llmData;
  
   console.log(`Using LLM provider: ${llmProvider}`);


   const cacheKey = `${userId}-${dbName}`;
   const cachedData = cache.get(cacheKey);
   const dbSchema = cachedData ? cachedData.schema : null;


   // Detect query type
   logger.info('Detecting query type...');
   const queryType = await detectQueryType(question, llmProvider, llmApiKey);
   logger.info(`Query type: ${queryType}`);


   if (queryType.type === 'insight') {
     logger.info('Generating insights...');
     const result = await handleInsightRequest(question, collectionName, dbUri, dbName, llmProvider, llmApiKey);
     return res.json(result);
   }


   // Handle regular query
   logger.info('Generating MongoDB query...');
   const rawQuery = await askMongoQuery(question, collectionName, dbSchema, llmProvider, llmApiKey);
   const { reasoning, query } = extractReasoningAndQuery(rawQuery);
    if (!query) {
     return res.status(422).json({ error: 'Failed to generate valid MongoDB query' });
   }


   const result = await runMongoQuery(query, dbUri, dbName);


   // Enrich with contextual data
   const idsToFind = findObjectIds(result);
   const contextualData = await findDocumentsByIds(idsToFind, dbUri, dbName);


   const summary = await askAnswerSummary(question, result, contextualData, llmProvider, llmApiKey);


   // Ask the LLM
   const { query: cleanedQuery, result: llmResult, summary: llmSummary } = await askLLM(
     question,
     dbSchema,
     contextualData,
     llmProvider,
     llmApiKey
   );
   console.log('LLM call successful');


   res.json({
     type: 'query',
     reasoning,
     query: JSON.parse(query),
     result,
     summary
   });
 } catch (error) {
   console.error('Error in ask handler:', error);
   res.status(500).json({ summary: `An error occurred: ${error.message}`, error: true });
 }
};


