const { createClient } = require('@supabase/supabase-js');
const { runMongoQuery } = require('./db');
const { askLLM } = require('./llm');


const supabase = createClient(
 process.env.SUPABASE_URL,
 process.env.SUPABASE_SERVICE_ROLE_KEY
)


async function detectQueryType(question) {
 const messages = [
   {
     role: "system",
     content: `Analyze if the given question can be converted into a MongoDB query or if it's a general insight request.
Respond ONLY with a JSON object in this format:
{
 "type": "query|insight",
 "reason": "brief explanation"
}
Rules:
1. type should be "query" if the question:
  - Asks for specific data or conditions
  - Contains filtering criteria
  - Requests counting or aggregation
2. type should be "insight" if the question:
  - Asks for general information
  - Requests data exploration
  - Seeks patterns or overview"`,
   },
   { role: "user", content: question },
 ];


 const response = await askLLM(messages);
 return safeJsonParseFromLLM(response);
}


// Add this function to handle insight requests
async function handleInsightRequest(question, collection, dbUri, dbName) {
 // First, get collection schema and sample
 const schemaQuery = {
   collection,
   method: "aggregate",
   pipeline: [
     { $sample: { size: 50 } },
     {
       $project: {
         _id: 0,
         __schema: {
           $objectToArray: "$$ROOT",
         },
       },
     },
   ],
 };


 const sampleData = await runMongoQuery(
   JSON.stringify(schemaQuery),
   dbUri,
   dbName
 );


 // Generate insights using LLM
 const messages = [
   {
     role: "system",
     content: `You are a data analyst. Given a MongoDB collection sample, provide insights about:
1. Data structure (fields and their types)
2. Value patterns and distributions
3. Potential relationships and use cases
Be specific and factual. Base insights only on the provided data.`,
   },
   {
     role: "user",
     content: `Collection: ${collection}\nQuestion: ${question}\nData Sample:\n${JSON.stringify(
       sampleData,
       null,
       2
     )}`,
   },
 ];


 const insights = await askLLM(messages);


 return {
   type: "insight",
   data: sampleData,
   summary: insights,
 };
}






function extractReasoningAndQuery(raw) {
 const reasoningMatch = raw.match(/<think>([\s\S]*?)<\/think>/i);
 let candidate = null;


 // Try 1: Parse entire response
 try {
   const parsed = JSON.parse(raw);
   if (parsed.collection && parsed.method)
     return {
       reasoning: reasoningMatch?.[1]?.trim() || null,
       query: raw,
     };
 } catch (_) { }


 // Try 2: Find last valid JSON substring
 let start = raw.lastIndexOf("{");
 while (start !== -1) {
   let count = 1;
   let end = start + 1;


   for (; end < raw.length && count > 0; end++) {
     if (raw[end] === "{") count++;
     else if (raw[end] === "}") count--;
   }


   if (count === 0) {
     try {
       const jsonStr = raw.substring(start, end);
       const parsed = JSON.parse(jsonStr);
       if (parsed.collection && parsed.method) {
         candidate = jsonStr;
         break;
       }
     } catch (_) { }
   }
   start = raw.lastIndexOf("{", start - 1);
 }


 return {
   reasoning: reasoningMatch?.[1]?.trim() || null,
   query: candidate,
 };
}


function safeJsonParseFromLLM(raw) {
 const matches = [...raw.matchAll(/{[\s\S]*?}/g)];
 const jsonStr = matches.length ? matches[matches.length - 1][0] : null;
 if (!jsonStr) throw new Error("No valid JSON found in LLM response");


 return JSON.parse(jsonStr);
}


module.exports = {
 extractReasoningAndQuery,
 safeJsonParseFromLLM,
 supabase,
 detectQueryType,
 handleInsightRequest,
};