function extractReasoningAndQuery(raw) {
  const reasoningMatch = raw.match(/<think>([\s\S]*?)<\/think>/i);
  let candidate = null;

  // Try 1: Parse entire response
  try {
    const parsed = JSON.parse(raw);
    if (parsed.collection && parsed.method)
      return {
        reasoning: reasoningMatch?.[1]?.trim() || null,
        query: raw,
      };
  } catch (_) {}

  // Try 2: Find last valid JSON substring
  let start = raw.lastIndexOf("{");
  while (start !== -1) {
    let count = 1;
    let end = start + 1;

    for (; end < raw.length && count > 0; end++) {
      if (raw[end] === "{") count++;
      else if (raw[end] === "}") count--;
    }

    if (count === 0) {
      try {
        const jsonStr = raw.substring(start, end);
        const parsed = JSON.parse(jsonStr);
        if (parsed.collection && parsed.method) {
          candidate = jsonStr;
          break;
        }
      } catch (_) {}
    }
    start = raw.lastIndexOf("{", start - 1);
  }

  return {
    reasoning: reasoningMatch?.[1]?.trim() || null,
    query: candidate,
  };
}

function safeJsonParseFromLLM(raw) {
  const matches = [...raw.matchAll(/{[\s\S]*?}/g)];
  const jsonStr = matches.length ? matches[matches.length - 1][0] : null;
  if (!jsonStr) throw new Error("No valid JSON found in LLM response");

  return JSON.parse(jsonStr);
}

module.exports = { extractReasoningAndQuery, safeJsonParseFromLLM };
