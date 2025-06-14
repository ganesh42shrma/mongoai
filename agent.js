const readline = require("readline-sync");
const { listCollections, runMongoQuery } = require("./lib/db");
const { askLLM, getModelInfo } = require("./lib/llm");
const { extractReasoningAndQuery } = require("./lib/utils");
const logger = require("./lib/logger");

async function askMongoQuery(question, collectionName) {
  const messages = [
    {
      role: "system",
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
6. Ensure valid JSON syntax`,
    },
    { role: "user", content: question },
  ];

  return await askLLM(messages);
}

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

async function main() {
  const [question, dbUri, dbName] = process.argv.slice(2);
  if (!question || !dbUri || !dbName) {
    return logger.error('Usage: node agent.js "<question>" "<mongoUri>" "<dbName>"');
  }

  const { model, useGroq } = getModelInfo();
  logger.info(`Using model: ${model} (${useGroq ? "Groq" : "Ollama"})`);
  logger.info(`Question: ${question}`);

  try {
    const collections = await listCollections(dbUri, dbName);
    if (!collections.length) {
      return logger.error("No collections found in the database.");
    }

    logger.info("Available Collections:");
    collections.forEach((name, i) => logger.info(`${i + 1}. ${name}`));
    const selectedIndex = readline.questionInt("Choose a collection by number: ") - 1;

    if (selectedIndex < 0 || selectedIndex >= collections.length) {
      return logger.error("Invalid collection selected.");
    }

    const selectedCollection = collections[selectedIndex];
    logger.info(`Using collection: ${selectedCollection}`);

    const rawQuery = await askMongoQuery(question, selectedCollection, dbUri, dbName);
    const { reasoning, query } = extractReasoningAndQuery(rawQuery);
    if (reasoning) {
      logger.info(`LLM Thinking: ${reasoning}`);
    }

    if (!query)
      throw new Error("Failed to extract valid JSON from LLM response.");

    logger.info(`Cleaned Query: ${query}`);

    const result = await runMongoQuery(query, dbUri, dbName);
    logger.info(`Result: ${result}`);

    const naturalAnswer = await askAnswerSummary(question, result);
    logger.info(`[MONGOMAN] ${naturalAnswer}`);
  } catch (err) {
    logger.error(`Error: ${err.message}`);
  }
}

main();
