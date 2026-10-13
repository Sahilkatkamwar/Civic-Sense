// server/routes/chat.js
// Civic Assistant Chatbot Endpoint powered by xAI Grok API

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../db/db');
const { askGrok } = require('../services/grok');
const { buildContextualSystemPrompt } = require('../services/chatPrompt');

// Rate limit: 20 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a moment before asking another question.',
    reply: 'You have reached the rate limit. Please wait a moment before sending another message.'
  }
});

const FRIENDLY_FALLBACK =
  'The assistant is unavailable right now. You can still report an issue or track a complaint from the menu.';

/**
 * POST /api/chat
 * Body: { messages: [ { role: 'user', content: '...' } ], wardId?: 'ward_02' }
 */
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { messages, wardId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // 1. Keep only last 10 messages and validate format
    const sanitizedMessages = [];
    const validRoles = ['user', 'assistant'];

    for (const msg of messages.slice(-10)) {
      if (!msg || typeof msg !== 'object') continue;
      const role = validRoles.includes(msg.role) ? msg.role : 'user';
      const content = typeof msg.content === 'string' ? msg.content.trim().slice(0, 1000) : '';
      if (content.length > 0) {
        sanitizedMessages.push({ role, content });
      }
    }

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: 'At least one valid message is required' });
    }

    // 2. Identify latest user message for live context injection
    const lastUserMsg = [...sanitizedMessages].reverse().find((m) => m.role === 'user');
    const latestUserText = lastUserMsg ? lastUserMsg.content : '';

    // 3. Build system prompt with live verified context
    const systemPromptContent = buildContextualSystemPrompt(db, {
      latestUserMessage: latestUserText,
      wardId
    });

    const fullMessages = [
      { role: 'system', content: systemPromptContent },
      ...sanitizedMessages
    ];

    // 4. Call Grok with fallback handling
    try {
      const reply = await askGrok({
        messages: fullMessages,
        temperature: 0.3,
        maxTokens: 400,
        timeoutMs: 20000
      });

      return res.json({ reply });
    } catch (grokErr) {
      // Server-side logging only; never leak error or keys to client
      console.error('[Civic Assistant Error]', grokErr.message);
      return res.json({ reply: FRIENDLY_FALLBACK });
    }
  } catch (err) {
    console.error('[Civic Assistant General Error]', err);
    return res.json({ reply: FRIENDLY_FALLBACK });
  }
});

module.exports = router;
