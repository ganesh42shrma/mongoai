import { useEffect, useState } from "react"
import Sidebar from "./components/Sidebar"
import MainPanel from "./components/MainPanel"
import axios from "axios"

function App() {
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState("")
  const [query, setQuery] = useState("")
  const [result, setResult] = useState(null)
  const [summary, setSummary] = useState("")
  const [cleanedQuery, setCleanedQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [dbConfig, setDbConfig] = useState({
    dbUri: "",
    dbName: "",
    shouldConnect: false
  })

  useEffect(() => {
    // Fetch collections only when shouldConnect is true
    const fetchCollections = async () => {
      if (!dbConfig.shouldConnect || !dbConfig.dbUri || !dbConfig.dbName) {
        setCollections([])
        return
      }

      try {
        const res = await axios.post("http://localhost:3000/collections", {
          dbUri: dbConfig.dbUri,
          dbName: dbConfig.dbName
        })
        setCollections(res.data.collections)
      } catch (err) {
        console.error("Failed to fetch collections:", err.message)
        setCollections([])
        setDbConfig(prev => ({ ...prev, shouldConnect: false }))
      }
    }

    fetchCollections()
  }, [dbConfig.shouldConnect, dbConfig.dbUri, dbConfig.dbName])

  const handleAsk = async () => {
    if (!query || !selectedCollection || !dbConfig.dbUri || !dbConfig.dbName) return
    setLoading(true)

    try {
      const res = await axios.post(
        "http://localhost:3000/ask",
        {
          question: query,
          collection: selectedCollection,
          dbUri: dbConfig.dbUri,
          dbName: dbConfig.dbName
        },
        { timeout: 10000 }
      )

      setCleanedQuery(res.data.query)
      setResult(res.data.result)
      setSummary(res.data.summary)
    } catch (err) {
      console.error("Ask error:", err.message)
      setResult(null)
      setSummary("Failed to process query. Please try again.")
    } finally {
      setLoading(false)
      setQuery("")
    }
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar
        collections={collections}
        onSelect={setSelectedCollection}
        selectedCollection={selectedCollection}
        dbConfig={dbConfig}
        onDbConfigChange={setDbConfig}
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
      />
    </div>
  )
}

export default App
