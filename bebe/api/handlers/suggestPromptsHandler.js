const { askLLM } = require('../../lib/llm');
const { supabase } = require('../../lib/utils');
const cache = require('../../lib/cache');


module.exports = async (req, res) => {
 try {
   const { collectionName } = req.query;
   const userId = req.user.id;
  
   if (!collectionName) {
     return res.status(400).json({ error: 'Collection name is required' });
   }


   console.log(`Generating prompt suggestions for collection: ${collectionName}`);


   // Fetch DB config from Supabase
   const { data: dbData, error: dbError } = await supabase
     .from('user_configs')
     .select('db_uri, db_name')
     .eq('user_id', userId)
     .single();


   if (dbError) throw dbError;
   if (!dbData) return res.status(404).json({ error: 'Database configuration not found.' });
   const { db_uri: dbUri, db_name: dbName } = dbData;


   // Fetch LLM config from Supabase (use first available config)
   const { data: llmData, error: llmError } = await supabase
     .from('user_llm_configs')
     .select('provider, api_key')
     .eq('user_id', userId)
     .limit(1)
     .single();


   if (llmError) throw llmError;
   if (!llmData) return res.status(404).json({ error: 'No LLM configuration found.' });


   const { provider: llmProvider, api_key: llmApiKey } = llmData;


   // Get cached schema
   const cacheKey = `${userId}-${dbName}`;
   const cachedData = cache.get(cacheKey);
  
   if (!cachedData || !cachedData.schema) {
     return res.status(404).json({ error: 'Schema not found. Please refresh the collections first.' });
   }


   const schema = cachedData.schema;
   const collectionSchema = schema[collectionName];
  
   if (!collectionSchema) {
     return res.status(404).json({ error: `Schema for collection '${collectionName}' not found.` });
   }


   // Generate prompt suggestions using LLM
   const messages = [
     {
       role: "system",
       content: `You are an expert data analyst helping users explore their MongoDB collection. Based on the following schema information, generate 4-6 specific, actionable question suggestions that users could ask to gain insights from their data.


Generate questions that:
1. Are specific to the actual fields in this collection
2. Would provide valuable business insights
3. Cover different types of analysis (patterns, distributions, outliers, trends, etc.)
4. Are phrased naturally as questions a business user would ask
5. Are actionable and specific to the data structure


Return only the questions as a JSON array of strings, no explanations or additional text. Example format:
["What are the most common values in the status field?", "Show me the distribution of amounts by category"]`
     },
     {
       role: "user",
       content: `Schema Information for collection "${collectionName}":
- Fields: ${collectionSchema.fields.join(', ')}
- Relations: ${collectionSchema.relations.length > 0 ? collectionSchema.relations.map(r => `${r.fromField} -> ${r.toCollection}`).join(', ') : 'None'}


Generate 4-6 question suggestions:`
     }
   ];


   const suggestions = await askLLM(messages, llmProvider, llmApiKey);


   // Parse the suggestions (they should be returned as JSON)
   let parsedSuggestions;
   try {
     parsedSuggestions = JSON.parse(suggestions);
     // If the LLM returns a stringified array as a string, parse again
     if (typeof parsedSuggestions === 'string') {
       parsedSuggestions = JSON.parse(parsedSuggestions);
     }
   } catch (error) {
     // If parsing fails, try to extract suggestions from the response
     console.warn('Failed to parse LLM response as JSON, attempting to extract suggestions');
     const lines = suggestions.split('\n').map(line => line.trim()).filter(line =>
       line && !line.startsWith('[') && !line.startsWith(']') && !line.startsWith('"') && !line.endsWith('",')
     );
     parsedSuggestions = lines.slice(0, 6); // Take first 6 lines as suggestions
   }


   // Ensure we have an array of strings
   if (!Array.isArray(parsedSuggestions)) {
     parsedSuggestions = [
       "What are the most common patterns in this collection?",
       "Show me the distribution of values in this dataset",
       "Find unusual or outlier records in this collection",
       "What insights can you provide about this data?"
     ];
   }


   console.log(`Generated ${parsedSuggestions.length} prompt suggestions for ${collectionName}`);


   res.json({ suggestions: parsedSuggestions });
 } catch (error) {
   console.error('Error in suggest prompts handler:', error);
   res.status(500).json({
     error: `Failed to generate prompt suggestions: ${error.message}`,
     suggestions: [
       "What are the most common patterns in this collection?",
       "Show me the distribution of values in this dataset",
       "Find unusual or outlier records in this collection",
       "What insights can you provide about this data?"
     ]
   });
 }
};


