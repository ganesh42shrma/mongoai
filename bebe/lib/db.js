const { MongoClient } = require("mongodb");

async function listCollections(dbUri, dbName) {
  const client = new MongoClient(dbUri);
  await client.connect();
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  await client.close();
  return collections.map((col) => col.name);
}

async function runMongoQuery(jsonString, dbUri, dbName) {
  const client = new MongoClient(dbUri);
  await client.connect();
  const db = client.db(dbName);

  let query;
  try {
    query = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Failed to parse LLM response: " + err.message);
  }

  const collection = db.collection(query.collection);
  const method = query.method;
  const filter = query.filter || {};
  const document = query.document || {};
  const projection = query.projection || {};

  let result;

  switch (method) {
    case "find":
      result = await collection.find(filter, { projection }).toArray();
      break;
    case "count":
      result = await collection.countDocuments(filter);
      break;
    case "insertOne":
      result = await collection.insertOne(document);
      break;
    case "deleteMany":
      result = await collection.deleteMany(filter);
      break;
    case "updateOne":
      result = await collection.updateOne(filter, { $set: document });
    case "aggregate":
      result = await collection.aggregate(query.pipeline || []).toArray();
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  await client.close();
  return result;
}

module.exports = { listCollections, runMongoQuery };
