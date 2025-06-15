import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import MainPanel from "./components/MainPanel";
import AuthModal from "./components/AuthModal";
import axios from "axios";
import supabase from "./utils/supabase";

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load user config when user is authenticated
  useEffect(() => {
    if (user) {
      loadUserConfig();
    } else {
      // Reset config when user logs out
      setDbConfig({
        dbUri: "",
        dbName: "",
        shouldConnect: false,
      });
    }
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

  // Enhanced dbConfig change handler
  const handleDbConfigChange = (newConfig) => {
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
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  useEffect(() => {
    // Fetch collections only when shouldConnect is true
    const fetchCollections = async () => {
      if (!dbConfig.shouldConnect || !dbConfig.dbUri || !dbConfig.dbName) {
        setCollections([]);
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
      } catch (err) {
        console.error("Failed to fetch collections:", err.message);
        setCollections([]);
        setDbConfig((prev) => ({ ...prev, shouldConnect: false }));
      }
    };

    fetchCollections();
  }, [dbConfig.shouldConnect, dbConfig.dbUri, dbConfig.dbName]);

  const handleAsk = async () => {
    if (!query || !selectedCollection) return;
    setLoading(true);
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
        },
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      setCleanedQuery(res.data.query);
      setResult(res.data.result);
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Ask error:", err.message);
      setResult(null);
      setSummary("Failed to process query. Please try again.");
    } finally {
      setLoading(false);
      setQuery("");
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
    return <AuthModal />;
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
        onSelect={setSelectedCollection}
        selectedCollection={selectedCollection}
        dbConfig={dbConfig}
        onDbConfigChange={handleDbConfigChange}
        user={user}
        isOpen={sidebarOpen}
        onLogout={handleLogout}
        toggleSidebar={()=> setSidebarOpen(!sidebarOpen)}
      />
      <MainPanel
        query={query}
        setQuery={setQuery}
        handleAsk={handleAsk}
        result={result}
        summary={summary}
        cleanedQuery={cleanedQuery}
        loading={loading}
        selectedCollection={selectedCollection}
        dbConfig={dbConfig}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        toggleSidebar={()=> setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}

export default App;
