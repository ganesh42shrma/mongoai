# 🧠 MongoDB Natural Language Query Assistant

## ✨ Project Vision

A full-stack AI-powered assistant that lets users:

* Query any MongoDB collection using natural language
* View structured results with summaries and charts
* Save, search, and revisit past queries using vector embeddings

---

## ✅ Core Features

| Feature                         | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| 🧠 LLM-to-Mongo Translator      | Converts user questions into MongoDB queries using Groq/Ollama    |
| 📦 Multi-database support       | Supports local MongoDB + Atlas (user-provided URI)                |
| 📁 Dynamic collection selector  | Lists collections for user to choose                              |
| 📊 Executable Queries           | Runs `find`, `insertOne`, `count`, `updateOne`, `deleteMany`      |
| 🗣️ Natural Language Summarizer | Returns friendly summaries of query results                       |
| 🔌 Modular backend (Node.js)    | Fully modular `askLLM`, `runMongoQuery`, `cleanResponse` pipeline |

---

## 🧑‍💻 Fullstack Chat UI (Planned)

| Frontend (React/Next.js) | Backend (Express or Node API)              |
| ------------------------ | ------------------------------------------ |
| Chat interface           | `/ask` → send question, get JSON & summary |
| View JSON result         | `/summary` → natural language answer       |
| Render tables & charts   | `/suggest-chart` (LLM suggests chart type) |
| Select collection/db     | `/collections`, `/databases`               |
| Search history           | `/history`, `/search`                      |

---

## 📈 AI-Driven Visualization

Use LLM to suggest charts based on the query:

```json
{
  "chart": {
    "type": "bar",
    "x": "category",
    "y": "total",
    "title": "Total Revenue by Category"
  }
}
```

### 🔧 Frontend Renders Using:

* Recharts or Chart.js
* Auto-switch chart based on LLM recommendation
* Toggle between chart/table mode

---

## 🧠 Add Intelligence: Vector DB + History

### What You Can Do with Pinecone / Chroma / Weaviate:

| Use Case               | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| 💬 Semantic search     | “What was that query I asked about revenue last week?”               |
| 🧠 Query deduplication | Match new questions to old embeddings                                |
| 🗂️ Saved history      | Store full `{ question, query, answer, summary, result }` vectorized |
| 📌 Personalization     | Track user context for future recommendations                        |

### 🧬 Suggested Schema in Pinecone:

```json
{
  "id": "uuid",
  "values": [vector],
  "metadata": {
    "user": "ganesh42",
    "question": "...",
    "collection": "users",
    "summary": "..."
  }
}
```

### Integration Pipeline:

```text
[User Query]
   ↓
[Embed using OpenAI/Groq embed endpoint]
   ↓
[Upsert to Pinecone: vector + metadata]
   ↓
[On future queries: similarity search → suggestions/history]
```

---

## 🌐 Deployment Plan

| Platform             | Purpose                                |
| -------------------- | -------------------------------------- |
| 🖥️ Vercel / Netlify | Deploy chat-based frontend             |
| ⚙️ Render / Railway  | Deploy backend API (Node.js + Express) |
| 🧠 Groq API          | Fast LLM inference                     |
| 🔍 Pinecone / Chroma | History + semantic search              |
| ☁️ MongoDB Atlas     | Cloud DB for user’s queries/data       |

---

## 🧩 Optional Enhancements

| Feature                     | Impact                                      |
| --------------------------- | ------------------------------------------- |
| 🎙️ Voice input (WebSpeech) | Conversational interface                    |
| 📈 Dashboard templates      | Prebuilt charts based on schema             |
| 📤 CSV/Excel export         | Export query results                        |
| 🧾 Audit mode               | Logs all queries, summaries, raw LLM output |

---

## 🧠 Summary

This project empowers users to:

* Query **any MongoDB database with natural language**
* Get **accurate answers**, **summaries**, and **visualizations**
* Retain and retrieve past queries using **vector search**

---

## 📁 Suggested Repo Structure

```
/
├── agent.js              # CLI entry point
├── lib/
│   ├── llm.js            # askLLM, model selection
│   ├── db.js             # MongoDB logic
│   └── utils.js          # cleanResponse, extract logic
├── api/
│   └── index.js          # Express app (to expose endpoints)
├── frontend/
│   ├── pages/index.tsx   # Next.js chat UI
│   ├── components/       # UI: chatbox, result, chart
├── .env
```
