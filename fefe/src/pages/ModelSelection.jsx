import { useState, useEffect } from "react";
import axios from "axios";
import supabase from "../utils/supabase";
import PageLayout from "../components/PageLayout";


export default function ModelSelection({ onConfigSaved }) {
 const [provider, setProvider] = useState("groq");
 const [apiKey, setApiKey] = useState("");
 const [configName, setConfigName] = useState("");
 const [savedConfigs, setSavedConfigs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState("");


 const fetchConfig = async () => {
   setLoading(true);
   try {
     const { data: { session } } = await supabase.auth.getSession();
     const res = await axios.get("http://localhost:3000/model-config", {
       headers: { Authorization: `Bearer ${session?.access_token}` },
     });
     setSavedConfigs(res.data || []);
   } catch (error) {
     console.error("Error fetching model config:", error);
     setMessage("Could not load your saved configurations.");
   } finally {
     setLoading(false);
   }
 };


 useEffect(() => {
   fetchConfig();
 }, []);


 const handleSave = async (e) => {
   e.preventDefault();
   setSaving(true);
   setMessage("");
   try {
     const { data: { session } } = await supabase.auth.getSession();
     await axios.post(
       "http://localhost:3000/model-config",
       { provider, apiKey, configName },
       { headers: { Authorization: `Bearer ${session?.access_token}` } }
     );
     setMessage("Configuration saved successfully!");
     setProvider("groq");
     setApiKey("");
     setConfigName("");
     fetchConfig(); // Refresh the list
    
     // Notify parent component to refresh LLM configs
     if (onConfigSaved) {
       onConfigSaved();
     }
   } catch (error) {
     console.error("Error saving model config:", error);
     setMessage("Failed to save configuration. Please try again.");
   } finally {
     setSaving(false);
   }
 };


 const handleDelete = async (name) => {
   if (!window.confirm(`Are you sure you want to delete the configuration "${name}"? This action cannot be undone.`)) return;
   setSaving(true);
   setMessage("");
   try {
     const { data: { session } } = await supabase.auth.getSession();
     await axios.delete(`http://localhost:3000/model-config/${name}`, {
       headers: { Authorization: `Bearer ${session?.access_token}` },
     });
     setMessage("Configuration deleted successfully.");
     fetchConfig(); // Refresh the list
    
     // Notify parent component to refresh LLM configs
     if (onConfigSaved) {
       onConfigSaved();
     }
   } catch (error) {
     console.error("Error deleting model config:", error);
     setMessage("Failed to delete configuration. Please try again.");
   } finally {
     setSaving(false);
   }
 };


 return (
   <PageLayout title="Model Configuration" subtitle="Manage your AI model provider and API keys">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
       {/* Form to add new config */}
       <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8">
         <h3 className="text-xl font-bold mb-4">Add New Configuration</h3>
         <form onSubmit={handleSave} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-[#888888] mb-2">
               Configuration Name
             </label>
             <input
               type="text"
               value={configName}
               onChange={(e) => setConfigName(e.target.value)}
               className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
               placeholder="e.g., My Project Key"
               required
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-[#888888] mb-2">
               LLM Provider
             </label>
             <select
               value={provider}
               onChange={(e) => setProvider(e.target.value)}
               className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#0ea5e9] transition-colors"
             >
               <option value="groq">Groq</option>
               <option value="openai">OpenAI</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-[#888888] mb-2">
               API Key
             </label>
             <input
               type="password"
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
               placeholder="Enter your API key"
               required
             />
           </div>
           <div className="pt-2">
             <button
               type="submit"
               disabled={saving || !apiKey || !configName}
               className="w-full py-3 rounded-lg text-sm font-medium transition-colors bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white disabled:bg-[#1a1a1a] disabled:text-[#666666] disabled:cursor-not-allowed"
             >
               {saving ? "Saving..." : "Save Configuration"}
             </button>
           </div>
         </form>
         {message && (
           <p className="mt-6 text-sm text-center text-[#888888]">{message}</p>
         )}
       </div>


       {/* List of saved configs */}
       <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-8">
         <h3 className="text-xl font-bold mb-4">Saved Configurations</h3>
         {loading ? (
           <p>Loading...</p>
         ) : savedConfigs.length === 0 ? (
           <p className="text-[#888888] text-sm text-center mt-8">No configurations saved yet.</p>
         ) : (
           <ul className="space-y-4">
             {savedConfigs.map(config => (
               <li key={config.config_name} className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                 <div>
                   <p className="font-medium text-white">{config.config_name}</p>
                   <p className="text-sm text-[#888888]">{config.provider}</p>
                 </div>
                 <button
                   onClick={() => handleDelete(config.config_name)}
                   disabled={saving}
                   className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                   title="Delete Configuration"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </button>
               </li>
             ))}
           </ul>
         )}
       </div>
     </div>
   </PageLayout>
 );
}


