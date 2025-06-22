const { supabase } = require('../../lib/utils');
const logger = require('../../lib/logger');


module.exports = async (req, res) => {
 try {
   const { provider, apiKey, configName } = req.body;
   const userId = req.user.id;


   if (!provider || !apiKey || !configName) {
     return res.status(400).json({ error: 'Provider, API key, and a name are required.' });
   }


   const { error } = await supabase.from('user_llm_configs').upsert(
     {
       user_id: userId,
       provider,
       api_key: apiKey,
       config_name: configName,
       updated_at: new Date().toISOString(),
     },
     { onConflict: 'user_id,config_name' }
   );


   if (error) throw error;


   res.status(200).json({ message: 'Configuration saved successfully.' });
 } catch (error) {
   logger.error('Error saving model config:', error.message);
   res.status(500).json({ error: 'Failed to save configuration.' });
 }
};


