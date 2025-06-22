const { listCollections } = require("../../lib/db");
const { analyzeDatabaseSchema } = require("../../lib/schema");
const { summarizeSchema } = require("../../lib/utils");
const cache = require("../../lib/cache");
const logger = require("../../lib/logger");
const { supabase } = require("../../lib/utils");


module.exports = async (req, res) => {
 try {
   const userId = req.user.id;
   logger.info(
     `[collectionsHandler] userId used from collection handler: ${userId}`
   );


   // First, check if user has any LLM configurations
   const { data: llmConfigs, error: llmError } = await supabase
     .from("user_llm_configs")
     .select("config_name")
     .eq("user_id", userId);


   if (llmError) {
     logger.error(`[collectionsHandler] Error fetching LLM configs: ${llmError.message}`);
     return res.status(500).json({ error: "Failed to check user configuration" });
   }


   if (!llmConfigs || llmConfigs.length === 0) {
     logger.info(`[collectionsHandler] No LLM configs found for user ${userId}`);
     return res.status(400).json({
       error: "No AI model configurations found. Please configure at least one API key before accessing collections.",
       needsApiKeySetup: true
     });
   }


   // Fetch DB config from Supabase
   const { data, error } = await supabase
     .from("user_configs")
     .select("db_uri, db_name")
     .eq("user_id", userId)
     .single();
  
   logger.info(
     `[collectionsHandler] Supabase error: ${
       error ? JSON.stringify(error) : "none"
     }`
   );
   logger.info(
     `[collectionsHandler] Supabase data: ${
       data ? JSON.stringify(data) : "none"
     }`
   );
  
   if (error || !data) {
     return res.status(400).json({ error: "No database configuration found for user" , supabaseError: error, userId });
   }
  
   const dbUri = data.db_uri;
   const dbName = data.db_name;
   logger.info(`Listing collections for database: ${dbName}`);
   const collections = await listCollections(dbUri, dbName);


   // Analyze and cache schema if not already present
   const cacheKey = `${userId}-${dbName}`;
   let summary;


   if (!cache.has(cacheKey)) {
     logger.info(`No schema cache found for ${cacheKey}. Analyzing...`);
     const schema = await analyzeDatabaseSchema(dbUri, dbName);
     logger.info(`[SCHEMA MIND MAP] For ${dbName}:\n${JSON.stringify(schema, null, 2)}`);
    
     logger.info(`Generating schema summary for ${dbName}...`);
     summary = await summarizeSchema(schema);
     logger.info(`[SCHEMA SUMMARY] For ${dbName}:\n${summary}`);


     cache.set(cacheKey, { schema, summary });
     logger.info(`Schema and summary for ${cacheKey} analyzed and cached.`);
   } else {
     const cachedData = cache.get(cacheKey);
     summary = cachedData.summary;
   }


   res.json({ collections, summary });
 } catch (err) {
   logger.error(`Collection listing error: ${err.message}`);
   res.status(500).json({ error: err.message });
 }
};


