const { MongoClient, ObjectId } = require("mongodb");


// Basic pluralization/singularization helpers
function singularize(word) {
 if (word.endsWith("ies")) return word.slice(0, -3) + "y";
 if (word.endsWith("s")) return word.slice(0, -1);
 return word;
}


function pluralize(word) {
 const singular = singularize(word);
 if (singular.endsWith("y")) return singular.slice(0, -1) + "ies";
 return singular + "s";
}


async function analyzeDatabaseSchema(dbUri, dbName) {
 const client = new MongoClient(dbUri);
 await client.connect();
 const db = client.db(dbName);
 const collections = await db.listCollections().toArray();
 const collectionNames = collections.map(c => c.name);
 const schema = {};


 for (const col of collections) {
   const collectionName = col.name;
   schema[collectionName] = { fields: new Set(), relations: [] };


   const sampleDocs = await db.collection(collectionName).aggregate([{ $sample: { size: 50 } }]).toArray();
   if (sampleDocs.length === 0) continue;


   // Get all unique fields from sample
   sampleDocs.forEach(doc => {
     Object.keys(doc).forEach(field => schema[collectionName].fields.add(field));
   });


   // Infer relationships
   for (const field of schema[collectionName].fields) {
     if (field === '_id') continue;


     const isObjectIdLike = sampleDocs.some(doc => doc[field] && (doc[field] instanceof ObjectId || (typeof doc[field] === 'string' && /^[0-9a-fA-F]{24}$/.test(doc[field]))));


     if (isObjectIdLike || field.toLowerCase().endsWith('id')) {
       const potentialCollection = pluralize(field.replace(/_id|Id/g, ''));
       if (collectionNames.includes(potentialCollection) && potentialCollection !== collectionName) {
         schema[collectionName].relations.push({
           fromField: field,
           toCollection: potentialCollection,
         });
       }
     }
   }
   schema[collectionName].fields = Array.from(schema[collectionName].fields);
 }


 await client.close();
 return schema;
}


module.exports = { analyzeDatabaseSchema };


