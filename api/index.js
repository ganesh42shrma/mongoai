const express = require("express");
const { listCollections, runMongoQuery } = require("../lib/db");
const { askLLM, getModelInfo } = require("../lib/llm");
const {
  extractReasoningAndQuery,
  safeJsonParseFromLLM,
} = require("../lib/utils");
const logger = require("../lib/logger");
require("dotenv").config();

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  logger.info(`Request Body: ${JSON.stringify(req.body, null, 2)}`);

  // Capture response
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;
    logger.info(`Response (${duration}ms): ${JSON.stringify(body, null, 2)}`);
    return originalJson.call(this, body);
  };

  // Capture errors
  const originalStatus = res.status;
  res.status = function (code) {
    if (code >= 400) {
      logger.error(`Error Response (${code}): ${this.statusMessage}`);
    }
    return originalStatus.call(this, code);
  };

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  const { model, useGroq } = getModelInfo();
  res.json({ status: "ok", model, useGroq });
});

// List collections endpoint (POST version)
app.post("/collections", async (req, res) => {
  try {
    const { dbUri, dbName } = req.body;
    if (!dbUri || !dbName) {
      return res
        .status(400)
        .json({ error: "Missing dbUri or dbName in request body" });
    }
    logger.info(`Listing collections for database: ${dbName}`);
    const collections = await listCollections(dbUri, dbName);
    res.json({ collections });
  } catch (err) {
    logger.error(`Collection listing error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Ask question endpoint
app.post("/ask", async (req, res) => {
  try {
    const { question, dbUri, dbName, collection } = req.body;
    if (!question || !dbUri || !dbName || !collection) {
      return res.status(400).json({
        error: "Missing required parameters",
      });
    }

    logger.info(`Processing question: ${question}`);
    logger.info(`Target collection: ${collection}`);

    // Detect query type
    logger.info("Detecting query type...");
    const queryType = await detectQueryType(question);
    logger.info(`Query type: ${queryType}`);

    if (queryType.type === "insight") {
      logger.info("Generating insights...");
      const result = await handleInsightRequest(
        question,
        collection,
        dbUri,
        dbName
      );
      return res.json(result);
    }

    // Handle regular query
    logger.info("Generating MongoDB query...");
    const rawQuery = await askMongoQuery(question, collection, dbUri, dbName);
    const { reasoning, query } = extractReasoningAndQuery(rawQuery);

    if (!query) {
      return res.status(422).json({
        error: "Failed to generate valid MongoDB query",
      });
    }

    const result = await runMongoQuery(query, dbUri, dbName);
    const summary = await askAnswerSummary(question, result);

    res.json({
      type: "query",
      reasoning,
      query: JSON.parse(query),
      result,
      summary,
    });
  } catch (err) {
    logger.error(`Error processing question: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
// Helper function to generate MongoDB query
async function askMongoQuery(question, collection, dbUri, dbName) {
  //sample documents to infer available fields
  const SampleQuery = {
    collection,
    method: "aggregate",
    pipeline: [{ $sample: { size: 3 } }, { project: { _id: 0 } }],
  };

  const samples = await runMongoQuery(
    JSON.stringify(SampleQuery),
    dbUri,
    dbName
  );
  const fields = [...new Set(samples.flatMap((doc) => Object.keys(doc)))];
  const fieldHint = fields.length ? fields.join(",") : "no fields detected";

  const messages = [
    {
      role: "system",
      content: `You are a MongoDB query generator. Convert the user question into a MongoDB query using only the fields from this collection: [${fieldHint}].

Respond ONLY with valid JSON in this format:
{
  "collection": "${collection}",
  "method": "find",
  "filter": {},
  "projection": {}
}

Rules:
- Use only the provided fields
- Don't assume unknown fields
- Avoid explanations or code blocks
- Ensure valid JSON`,
    },
    { role: "user", content: question },
  ];

  return await askLLM(messages);
}

// Helper function to generate answer summary
async function askAnswerSummary(question, data) {
  if (!data || data.length === 0) {
    return "No results found for the query";
  }
  const messages = [
    {
      role: "system",
      content:
        "You are a data summarizer. Given a MongoDB result array, generate a short, accurate natural language answer. Do not make assumptions. Base your answer only on the data provided. If the result is empty, say so clearly.",
    },
    {
      role: "user",
      content: `Question: ${question}\nData:\n${JSON.stringify(data, null, 2)}`,
    },
  ];

  return await askLLM(messages);
}

// Add this function to detect query type using LLM
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
