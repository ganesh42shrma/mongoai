import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MainPanel from "./components/MainPanel";
import AuthModal from "./components/AuthModal";
import axios from "axios";
import supabase from "./utils/supabase";
import DotGrid from "./components/Backgrounds/DotGrid";


function App() {
 const [user, setUser] = useState(null);
 const [authLoading, setAuthLoading] = useState(true);
 const [configLoading, setConfigLoading] = useState(false);
 const [collections, setCollections] = useState([]);
 const [selectedCollection, setSelectedCollection] = useState("");
 const [query, setQuery] = useState("");
 const [result, setResult] = useState(null);
 const [summary, setSummary] = useState("");
 const [cleanedQuery, setCleanedQuery] = useState("");
 const [loading, setLoading] = useState(false);
 const [conversation, setConversation] = useState([]);
 const [schemaSummary, setSchemaSummary] = useState("");
 const [savedLlmConfigs, setSavedLlmConfigs] = useState([]);
 const [selectedLlmConfig, setSelectedLlmConfig] = useState("");
 const [needsApiKeySetup, setNeedsApiKeySetup] = useState(false);
 const [promptSuggestions, setPromptSuggestions] = useState([]);
 const [suggestionsLoading, setSuggestionsLoading] = useState(false);
 const [dbConfig, setDbConfig] = useState({
   dbUri: "",
   dbName: "",
   shouldConnect: false,
 });
 const [sidebarOpen, setSidebarOpen] = useState(true);


 // Handle authentication
 useEffect(() => {
   // Get initial session
   supabase.auth.getSession().then(({ data: { session } }) => {
     setUser(session?.user ?? null);
     setAuthLoading(false);
   });

   // Listen for auth changes
   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
     setUser(session?.user ?? null);
     setAuthLoading(false);
   });
   return () => subscription.unsubscribe();
 }, []);


 // Load user config when user is authenticated
 useEffect(() => {
   if (user) {
     loadUserConfig();
     loadLlmConfigs();
   } else {
     // Reset config when user logs out
     setDbConfig({
       dbUri: "",
       dbName: "",
       shouldConnect: false,
     });
     setSavedLlmConfigs([]);
     setSelectedLlmConfig("");
     setNeedsApiKeySetup(false);
   }
 }, [user]);


 // Refresh LLM configs periodically to catch changes from ModelSelection page
 useEffect(() => {
   if (!user) return;
  
   const interval = setInterval(() => {
     loadLlmConfigs();
   }, 5000); // Check every 5 seconds
  
   return () => clearInterval(interval);
 }, [user]);


 // Load user's saved database configuration
 const loadUserConfig = async () => {
   try {
     setConfigLoading(true);
     const { data, error } = await supabase
       .from("user_configs")
       .select("db_uri, db_name")
       .eq("user_id", user.id)
       .single();


     if (error && error.code !== "PGRST116") {
       // PGRST116 = no rows returned
       throw error;
     }


     if (data) {
       setDbConfig({
         dbUri: data.db_uri,
         dbName: data.db_name,
         shouldConnect: true, // Auto-connect with saved config
       });
     }
   } catch (error) {
     console.error("Error loading user config:", error.message);
   } finally {
     setConfigLoading(false);
   }
 };


 // Save user's database configuration
 const saveUserConfig = async (uri, name) => {
   try {
     const { error } = await supabase.from("user_configs").upsert(
       {
         user_id: user.id,
         db_uri: uri,
         db_name: name,
         updated_at: new Date().toISOString(),
       },
       { onConflict: ["user_id"] }
     );


     if (error) {
       if (error.code === "409") {
         console.warn("Config already exists, updating instead.");
       } else {
         throw error;
       }
     } else {
       console.log("User config saved successfully");
     }
   } catch (error) {
     console.error("Error saving user config:", error.message);
   }
 };


 // Function to fetch prompt suggestions for a collection
 const fetchPromptSuggestions = async (collectionName) => {
   if (!collectionName || needsApiKeySetup) {
     setPromptSuggestions([]);
     setSuggestionsLoading(false);
     return;
   }


   setSuggestionsLoading(true);
   try {
     const { data: { session } } = await supabase.auth.getSession();
     const res = await axios.get(`http://localhost:3000/suggest-prompts?collectionName=${encodeURIComponent(collectionName)}`, {
       headers: { Authorization: `Bearer ${session?.access_token}` },
     });
     setPromptSuggestions(res.data.suggestions || []);
   } catch (error) {
     console.error("Error fetching prompt suggestions:", error);
     // Fallback to default suggestions
     setPromptSuggestions([
       "What are the most common patterns in this collection?",
       "Show me the distribution of values in this dataset",
       "Find unusual or outlier records in this collection",
       "What insights can you provide about this data?"
     ]);
   } finally {
     setSuggestionsLoading(false);
   }
 };


 // Wrapper function to handle collection selection and fetch suggestions
 const handleCollectionSelect = (collectionName) => {
   setSelectedCollection(collectionName);
   fetchPromptSuggestions(collectionName);
 };


 // Enhanced dbConfig change handler
 const handleDbConfigChange = (newConfig) => {
   // When user explicitly tries to connect, clear old state
   if (newConfig.shouldConnect) {
     setConversation([]);
     setCollections([]);
     setSelectedCollection("");
   }
   setDbConfig(newConfig);
   // Save to Supabase when user connects
   if (
     newConfig.shouldConnect &&
     newConfig.dbUri &&
     newConfig.dbName &&
     user
   ) {
     saveUserConfig(newConfig.dbUri, newConfig.dbName);
   }
 };


 const handleLogout = async () => {
   try {
     const { error } = await supabase.auth.signOut();
     if (error) throw error;
     setUser(null);
     setDbConfig({
       dbUri: "",
       dbName: "",
       shouldConnect: false,
     });
     setCollections([]);
     setSelectedCollection("");
     setConversation([]); // Clear conversation on logout
     setSchemaSummary(""); // Clear summary on logout
     setSavedLlmConfigs([]);
     setSelectedLlmConfig("");
     setNeedsApiKeySetup(false);
   } catch (error) {
     console.error("Logout error:", error.message);
   }
 };


 useEffect(() => {
   // Only fetch collections if user has API keys configured and wants to connect
   const fetchCollections = async () => {
     if (!dbConfig.shouldConnect || !dbConfig.dbUri || !dbConfig.dbName || needsApiKeySetup) {
       setCollections([]);
       setSchemaSummary("");
       return;
     }
     try {
       // Send JWT token with request for backend validation
       const {
         data: { session },
       } = await supabase.auth.getSession();
       const res = await axios.post(
         "http://localhost:3000/collections",
         {},
         {
           headers: {
             Authorization: `Bearer ${session?.access_token}`,
           },
         }
       );
       setCollections(res.data.collections);
       setSchemaSummary(res.data.summary || "");


       // Only add the initial message if the conversation is empty
       if (res.data.summary && conversation.length === 0) {
         const cleanSummary = res.data.summary.replace(/<think>[\s\S]*?<\/think>/, "").trim();
         const initialMessage = {
           id: Date.now(),
           role: 'assistant',
           content: {
             summary: cleanSummary,
             query: null,
             result: null,
           },
         };
         setConversation([initialMessage]);
       }


     } catch (err) {
       console.error("Failed to fetch collections:", err.message);
      
       // Check if the error indicates API key setup is needed
       if (err.response?.data?.needsApiKeySetup) {
         setNeedsApiKeySetup(true);
         setCollections([]);
         setSchemaSummary("");
         setDbConfig((prev) => ({ ...prev, shouldConnect: false }));
         return;
       }
      
       setCollections([]);
       setSchemaSummary("");
       setDbConfig((prev) => ({ ...prev, shouldConnect: false }));
     }
   };


   fetchCollections();
 }, [dbConfig.shouldConnect, dbConfig.dbUri, dbConfig.dbName, needsApiKeySetup]);


 const loadLlmConfigs = async () => {
   try {
     const { data: { session } } = await supabase.auth.getSession();
     const res = await axios.get("http://localhost:3000/model-config", {
       headers: { Authorization: `Bearer ${session?.access_token}` },
     });
     const configs = res.data || [];
     setSavedLlmConfigs(configs);
    
     // Check if user needs to set up API keys
     if (configs.length === 0) {
       setNeedsApiKeySetup(true);
       setSelectedLlmConfig(""); // Clear selected config
       // Clear collections and conversation since no API keys are available
       setCollections([]);
       setSelectedCollection("");
       setConversation([]);
       setSchemaSummary("");
       return;
     }
    
     setNeedsApiKeySetup(false);
    
     // Check if currently selected config still exists
     const configExists = configs.some(config => config.config_name === selectedLlmConfig);
     if (!configExists) {
       // If selected config no longer exists, select the first available one
       setSelectedLlmConfig(configs[0].config_name);
     } else if (!selectedLlmConfig) {
       // If no config is selected, select the first one
       setSelectedLlmConfig(configs[0].config_name);
     }
   } catch (error) {
     console.error("Error fetching LLM configs:", error);
     setNeedsApiKeySetup(true);
     setSelectedLlmConfig("");
     // Clear collections and conversation on error
     setCollections([]);
     setSelectedCollection("");
     setConversation([]);
     setSchemaSummary("");
   }
 };


 // Function to refresh LLM configs (called after adding new config)
 const refreshLlmConfigs = async () => {
   await loadLlmConfigs();
 };


 const handleAsk = async () => {
   if (!query || !selectedCollection || !selectedLlmConfig) return;


   // Validate that the selected config still exists
   const configExists = savedLlmConfigs.some(config => config.config_name === selectedLlmConfig);
   if (!configExists) {
     // Refresh configs and try again
     await loadLlmConfigs();
     if (!selectedLlmConfig) {
       // If still no config, show error
       const errorMessage = {
         id: Date.now() + 1,
         role: 'assistant',
         content: {
           summary: "No valid AI model configuration found. Please configure an API key in the Model Configuration page.",
           error: true,
         },
       };
       setConversation((prev) => [...prev, errorMessage]);
       return;
     }
   }


   const userMessage = {
     id: Date.now(),
     role: 'user',
     content: query,
   };
   setConversation((prev) => [...prev, userMessage]);


   setLoading(true);
   setQuery("");


   try {
     // Send JWT token with request for backend validation
     const {
       data: { session },
     } = await supabase.auth.getSession();


     const res = await axios.post(
       "http://localhost:3000/ask",
       {
         question: query,
         collection: selectedCollection,
         configName: selectedLlmConfig,
       },
       {
         timeout: 10000,
         headers: {
           Authorization: `Bearer ${session?.access_token}`,
         },
       }
     );


     const assistantMessage = {
       id: Date.now() + 1,
       role: 'assistant',
       content: res.data,
     };
     setConversation((prev) => [...prev, assistantMessage]);


   } catch (err) {
     console.error("Ask error:", err.message);
    
     // Check if the error is due to missing config
     if (err.response?.data?.configNotFound) {
       const errorMessage = {
         id: Date.now() + 1,
         role: 'assistant',
         content: {
           summary: err.response.data.error || "The selected AI model configuration is no longer available. Please select a different model or configure a new API key.",
           error: true,
         },
       };
       setConversation((prev) => [...prev, errorMessage]);
       // Refresh configs to update the UI
       await loadLlmConfigs();
     } else {
       const errorMessage = {
         id: Date.now() + 1,
         role: 'assistant',
         content: {
           summary: "Sorry, something went wrong. The server might be busy or unavailable. Please try again.",
           error: true,
         },
       };
       setConversation((prev) => [...prev, errorMessage]);
     }
   } finally {
     setLoading(false);
   }
 };


 // Show loading while checking authentication
 if (authLoading) {
   return (
     <div className="flex items-center justify-center h-screen w-screen bg-[#0a0a0a] text-white">
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
         <p>Loading...</p>
       </div>
     </div>
   );
 }


 // Show auth modal if user is not authenticated
 if (!user) {
   return (
     <div className="grid grid-cols-3 grid-rows-3 fixed inset-0 z-0 bg-black">
       {[...Array(9)].map((_, i) => (
         <div key={i} className="relative w-full h-full">
           <DotGrid
             dotSize={8}
             gap={10}
             baseColor="#555555" // or use a Tailwind color like "#6B7280" for gray-500
             activeColor="#FFFFFF"
             proximity={120}
             shockRadius={250}
             shockStrength={5}
             resistance={750}
             returnDuration={1.5}
             style={{
               position: "absolute",
               top: 0,
               left: 0,
               width: "100%",
               height: "100%",
               zIndex: 0,
             }}
           />
         </div>
       ))}


       {/* Center grid cell: row 2, column 2 (index 4 in a flat array) */}
       <div className="col-start-2 row-start-2 flex items-center justify-center relative z-100">
         <AuthModal />
       </div>
     </div>
   );
 }


 // Show loading while fetching user config
 if (configLoading) {
   return (
     <div className="flex items-center justify-center h-screen w-screen bg-[#0a0a0a] text-white">
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
         <p>Loading your configuration...</p>
       </div>
     </div>
   );
 }


 // Show main app if user is authenticated
 return (
   <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
     <Sidebar
       collections={collections}
       onSelect={handleCollectionSelect}
       selectedCollection={selectedCollection}
       dbConfig={dbConfig}
       onDbConfigChange={handleDbConfigChange}
       user={user}
       isOpen={sidebarOpen}
       onLogout={handleLogout}
       toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
       refreshLlmConfigs={refreshLlmConfigs}
     />
     <MainPanel
       query={query}
       setQuery={setQuery}
       handleAsk={handleAsk}
       conversation={conversation}
       loading={loading}
       selectedCollection={selectedCollection}
       dbConfig={dbConfig}
       user={user}
       onLogout={handleLogout}
       isOpen={sidebarOpen}
       toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
       savedLlmConfigs={savedLlmConfigs}
       selectedLlmConfig={selectedLlmConfig}
       onSelectLlmConfig={setSelectedLlmConfig}
       needsApiKeySetup={needsApiKeySetup}
       promptSuggestions={promptSuggestions}
       fetchPromptSuggestions={fetchPromptSuggestions}
       suggestionsLoading={suggestionsLoading}
     />
   </div>
 );
}


export default App;
