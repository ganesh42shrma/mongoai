const { supabase } = require('../../lib/utils');
const logger = require('../../lib/logger');


module.exports = async (req, res) => {
 try {
   const userId = req.user.id;
   const { name } = req.params;


   if (!name) {
     return res.status(400).json({ error: 'Configuration name is required.' });
   }


   const { error } = await supabase
     .from('user_llm_configs')
     .delete()
     .eq('user_id', userId)
     .eq('config_name', name);


   if (error) throw error;


   res.status(200).json({ message: 'Configuration deleted successfully.' });
 } catch (error) {
   logger.error('Error deleting model config:', error.message);
   res.status(500).json({ error: 'Failed to delete configuration.' });
 }
};

