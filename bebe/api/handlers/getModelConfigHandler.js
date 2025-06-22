const { supabase } = require('../../lib/utils');
const logger = require('../../lib/logger');


module.exports = async (req, res) => {
 try {
   const userId = req.user.id;


   const { data, error } = await supabase
     .from('user_llm_configs')
     .select('provider, config_name')
     .eq('user_id', userId);


   if (error) {
     throw error;
   }


   res.status(200).json(data);
 } catch (error) {
   logger.error('Error fetching model configs:', error.message);
   res.status(500).json({ error: 'Failed to fetch configurations.' });
 }
};


