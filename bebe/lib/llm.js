const axios = require("axios");
require("dotenv").config();


// Default values, can be overridden by user config
const DEFAULT_PROVIDERS = {
 groq: {
   baseURL: "https://api.groq.com/openai/v1",
   model: "llama3-8b-8192",
 },
 openai: {
   baseURL: "https://api.openai.com/v1",
   model: "gpt-3.5-turbo",
 },
};


async function askLLM(messages, provider = "groq", apiKey = null) {
 const selectedProvider = DEFAULT_PROVIDERS[provider];
 if (!selectedProvider) {
   throw new Error(`Invalid LLM provider selected: ${provider}`);
 }


 // Use the provided API key or fallback to environment variables for default setup
 const finalApiKey = apiKey || (provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY);


 if (!finalApiKey) {
   throw new Error(`API key for ${provider} is not configured.`);
 }


 try {
   const resp = await axios.post(
     `${selectedProvider.baseURL}/chat/completions`,
     { model: selectedProvider.model, messages },
     {
       headers: {
         Authorization: `Bearer ${finalApiKey}`,
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
 // This function might need to be re-evaluated as model info is now dynamic
 return { model: "dynamic", useGroq: "dynamic" };
}


module.exports = { askLLM, getModelInfo };




