// server/services/grok.js
// Thin client for xAI Grok API (OpenAI-compatible chat completions)

function getApiUrl() {
  if (process.env.GROK_API_URL) return process.env.GROK_API_URL;
  const key = process.env.GROK_API_KEY || '';
  if (key.startsWith('gsk_')) return 'https://api.groq.com/openai/v1/chat/completions';
  return 'https://api.x.ai/v1/chat/completions';
}

function getModel() {
  if (process.env.GROK_MODEL) return process.env.GROK_MODEL;
  const key = process.env.GROK_API_KEY || '';
  if (key.startsWith('gsk_')) return 'qwen/qwen3.8-27b';
  return 'grok-4';
}

/**
 * Sends chat completion request to Groq / Grok API.
 * @param {Object} options
 * @param {Array} options.messages - Array of { role, content } objects
 * @param {number} [options.temperature=0.3]
 * @param {number} [options.maxTokens=400]
 * @param {number} [options.timeoutMs=20000]
 * @returns {Promise<string>} Completion response text
 */
async function askGrok({ messages, temperature = 0.3, maxTokens = 400, timeoutMs = 20000 }) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === 'your_xai_api_key_here') {
    const error = new Error('GROK_API_KEY is not configured');
    error.code = 'NO_API_KEY';
    throw error;
  }

  const apiUrl = getApiUrl();
  const model = getModel();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Malformed response received from AI API');
    }

    const msg = data.choices[0].message;
    return msg.content || msg.reasoning || '';
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI API request timed out after 20 seconds');
    }
    throw err;
  }
}

/**
 * Helper to auto-translate an announcement's title and body into Hindi and Marathi.
 * Returns { hi: { title, body }, mr: { title, body } }
 */
async function translateAlertText({ title, body }) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === 'your_xai_api_key_here') {
    return null;
  }

  const systemMessage = {
    role: 'system',
    content: 'You are an official translation engine for a municipal administration in Maharashtra, India. Translate municipal announcements into accurate Hindi and Marathi. Return ONLY raw JSON in this exact structure: {"hi": {"title": "...", "body": "..."}, "mr": {"title": "...", "body": "..."}}. Do NOT wrap in markdown code blocks or backticks.'
  };

  const userMessage = {
    role: 'user',
    content: `Title: ${title}\nBody: ${body}`
  };

  const reply = await askGrok({
    messages: [systemMessage, userMessage],
    temperature: 0.1,
    maxTokens: 500,
    timeoutMs: 20000
  });

  try {
    // Clean reply of potential markdown fences
    let cleanJson = reply.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    const parsed = JSON.parse(cleanJson);
    return {
      hi: {
        title: parsed.hi?.title || title,
        body: parsed.hi?.body || body
      },
      mr: {
        title: parsed.mr?.title || title,
        body: parsed.mr?.body || body
      }
    };
  } catch (err) {
    console.error('[Grok Translation] Failed to parse JSON response:', reply);
    throw new Error('Could not parse translation output');
  }
}

module.exports = {
  askGrok,
  translateAlertText
};
