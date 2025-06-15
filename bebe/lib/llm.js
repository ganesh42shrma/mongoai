const axios = require("axios");
require("dotenv").config();

const useGroq = !!process.env.GROQ_API_KEY;
const baseURL = useGroq
  ? "https://api.groq.com/openai/v1"
  : "http://localhost:11434/v1";
const apiKey = useGroq ? process.env.GROQ_API_KEY : "ollama";
const model = useGroq ? "deepseek-r1-distill-llama-70b" : "llama2";

async function askLLM(messages) {
  try {
    const resp = await axios.post(
      `${baseURL}/chat/completions`,
      { model, messages },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return resp.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ LLM Request Error:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw err;
  }
}

function getModelInfo() {
  return { model, useGroq };
}

module.exports = { askLLM, getModelInfo };
