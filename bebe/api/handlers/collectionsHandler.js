const { listCollections } = require("../../lib/db");
const logger = require("../../lib/logger");
const { supabase } = require("../../lib/utils");

module.exports = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(
      `[collectionsHandler] userId used from collection handler: ${userId}`
    ); // Fetch config from Supabase
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
      return res.status(400).json({ error: "No config found for user" , supabaseError: error, userId });
    }
    const dbUri = data.db_uri;
    const dbName = data.db_name;
    logger.info(`Listing collections for database: ${dbName}`);
    const collections = await listCollections(dbUri, dbName);
    res.json({ collections });
  } catch (err) {
    logger.error(`Collection listing error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};
