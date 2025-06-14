const express = require('express');
const { listCollections, runMongoQuery } = require('../lib/db');
const { askLLM, getModelInfo } = require('../lib/llm');
const { extractReasoningAndQuery } = require('../lib/utils');
require('dotenv').config();

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const { model, useGroq } = getModelInfo();
  res.json({ status: 'ok', model, useGroq });
});

// List collections endpoint (POST version)
app.post('/collections', async (req, res) => {
  try {
    const { dbUri, dbName } = req.body;
    if (!dbUri || !dbName) {
      return res.status(400).json({ error: 'Missing dbUri or dbName in request body' });
    }
    const collections = await listCollections(dbUri, dbName);
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ask question endpoint
app.post('/ask', async (req, res) => {
  try {
    const { question, dbUri, dbName, collection } = req.body;
    if (!question || !dbUri || !dbName || !collection) {
      return res.status(400).json({
        error: 'Missing required parameters: question, dbUri, dbName, collection'
      });
    }

    // Generate MongoDB query using LLM
    const rawQuery = await askMongoQuery(question, collection);
    const { reasoning, query } = extractReasoningAndQuery(rawQuery);
    
    if (!query) {
      return res.status(422).json({
        error: 'Failed to generate valid MongoDB query'
      });
    }

    // Execute the query
    const result = await runMongoQuery(query, dbUri, dbName);
    
    // Generate natural language summary
    const summary = await askAnswerSummary(question, result);

    res.json({
      reasoning,
      query: JSON.parse(query),
      result,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate MongoDB query
async function askMongoQuery(question, collectionName) {
  const messages = [
    {
      role: 'system',
      content: `Convert the user query into a MongoDB query. Respond ONLY with valid JSON in this format:
{
  "collection": "collection_name",
  "method": "find|aggregate|etc",
  "filter": {},
  "projection": {}
}
Rules:
1. Use EXACT field names from the collection
2. Only include filter conditions explicitly stated
3. For date ranges, use ISO strings ("YYYY-MM-DD")
4. Omit undefined parameters
5. NEVER include explanations or formatting
6. Ensure valid JSON syntax`
    },
    { role: 'user', content: question }
  ];

  return await askLLM(messages);
}

// Helper function to generate answer summary
async function askAnswerSummary(question, data) {
  if (!data || data.length === 0) {
    return 'No results found for the query';
  }
  const messages = [
    {
      role: 'system',
      content: 'You are a data summarizer. Given a MongoDB result array, generate a short, accurate natural language answer. Do not make assumptions. Base your answer only on the data provided. If the result is empty, say so clearly.'
    },
    {
      role: 'user',
      content: `Question: ${question}\nData:\n${JSON.stringify(data, null, 2)}`
    }
  ];

  return await askLLM(messages);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});