const { createClient } = require('@supabase/supabase-js');
const { runMongoQuery } = require('./db');
const { askLLM } = require('./llm');








const supabase = createClient(
 process.env.SUPABASE_URL,
 process.env.SUPABASE_SERVICE_ROLE_KEY
)








async function detectQueryType(question, provider, apiKey) {
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








 const response = await askLLM(messages, provider, apiKey);
 return safeJsonParseFromLLM(response);
}








// Add this function to handle insight requests
async function handleInsightRequest(question, collection, dbUri, dbName, provider, apiKey) {
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








 const insights = await askLLM(messages, provider, apiKey);








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








async function askMongoQuery(question, collection, dbSchema = null, provider, apiKey) {
 const schemaPart = dbSchema ? `
Here is the database schema which describes the collections, their fields, and their relationships. Use this to construct queries, especially for performing joins between collections using the $lookup aggregation stage.


<schema>
${JSON.stringify(dbSchema, null, 2)}
</schema>
` : '';


 const messages = [
   {
     role: "system",
     content: `You are an expert MongoDB query writer. Convert the user's question into a valid MongoDB query.
${schemaPart}
Respond ONLY with valid JSON in this format:
{
 "collection": "${collection}",
 "method": "find|aggregate|etc",
 "pipeline": [],
 "filter": {},
 "projection": {}
}
Rules:
1. The 'collection' MUST be the one specified by the user: "${collection}".
2. For questions that require data from related collections, you MUST use an 'aggregate' method with a '$lookup' stage.
3. NEVER include explanations or formatting. Ensure valid JSON syntax.`,
   },
   { role: "user", content: `Collection: ${collection}\nQuestion: ${question}` },
 ];


 return await askLLM(messages, provider, apiKey);
}


async function summarizeSchema(schema, provider, apiKey) {
 if (!schema) return "No schema information available to summarize.";


 const messages = [
   {
     role: "system",
     content: `You are a friendly and helpful AI assistant. Your task is to welcome the user and provide a simple, easy-to-understand overview of their connected database based on its JSON schema.


**Instructions:**
1.  **Start with a warm, welcoming greeting.**
2.  **Use emojis** to make the summary more engaging (e.g., 📦 for collections, 🔗 for relationships).
3.  **Do NOT use technical jargon.** Avoid phrases like "JSON schema definition" or "human-readable summary."
4.  **Do NOT include boilerplate introductions** like "Here is a summary...". Just start with the greeting.
5.  **Use clear, well-spaced formatting.** Create distinct sections for "Collections" and "Relationships" using bold markdown headings.
6.  **Under each heading, use a bulleted list (\`-\`)** for each item. Each item in the list should be a separate point.
7.  **Ensure there is vertical space between paragraphs and list items** by using double line breaks in the markdown source.


**Example Output Style:**
"Hello! 👋 I've connected to your database and here's what I see:


📦 **Collections**


- **inventories**: This seems to hold all your product information, including names, prices, and stock levels.
- **users**: This is where your user accounts and their details are stored.


🔗 **Relationships**


- The \`products\` collection links to \`categories\` to help organize your items."`
   },
   {
     role: "user",
     content: `Here is the database schema:\n${JSON.stringify(schema, null, 2)}`
   }
 ];


 return await askLLM(messages, provider, apiKey);
}


async function askAnswerSummary(question, data, contextualData = {}, provider, apiKey) {
 if (!data || data.length === 0) {
   return "No results found for the query";
 }
 const messages = [
   {
     role: "system",
     content: `You are a data summarizer. Given a MongoDB result array, generate a short, accurate natural language answer.
The user's query may involve relationships between different collections.
You have been provided with additional 'contextualData' which contains documents referenced by ObjectIDs from the main query result.
Use this contextual data to provide a richer, more complete answer. For example, if the main result has a 'userId', you can use the user document from the contextual data to refer to the user by name.
Do not make assumptions. Base your answer only on the data and the contextual data provided. If the result is empty, say so clearly.
The final output should be markdown-formatted.`,
   },
   {
     role: "user",
     content: `Question: ${question}\n\nMain Data:\n${JSON.stringify(
       data,
       null,
       2
     )}\n\nContextual Data:\n${JSON.stringify(contextualData, null, 2)}`,
   },
 ];




 return await askLLM(messages, provider, apiKey);
}


function findObjectIds(data, foundIds = new Set()) {
 if (!data) return [];


 if (Array.isArray(data)) {
   for (const item of data) {
     findObjectIds(item, foundIds);
   }
 } else if (typeof data === 'object' && data !== null) {
   for (const key in data) {
     const value = data[key];
     // Basic validation for a 24-char hex string.
     if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
       foundIds.add(value);
     } else if (typeof value === 'object') {
       findObjectIds(value, foundIds);
     }
   }
 }
 return Array.from(foundIds);
}


module.exports = {
 extractReasoningAndQuery,
 safeJsonParseFromLLM,
 supabase,
 detectQueryType,
 handleInsightRequest,
 askMongoQuery,
 askAnswerSummary,
 findObjectIds,
 summarizeSchema,
};