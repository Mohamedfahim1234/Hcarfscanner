// src/server/aiChat.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();


// Allow API key override from header (for secure modal input)
function getOpenRouterKey(req) {
  return req.headers['x-openrouter-key'] || process.env.OPENROUTER_API_KEY;
}


// Helper: Call Ollama with retry
async function callOllama(messages, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', messages })
      });
      if (!res.ok) throw new Error('Ollama failed');
      const data = await res.json();
      if (!data.message || !data.message.content) throw new Error('No reply from Ollama');
      return data.message.content;
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
}

// Helper: Call OpenRouter fallback with retry
async function callOpenRouter(messages, req, retries = 1) {
  const apiKey = getOpenRouterKey(req);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'wizardlm/WizardLM-2-8x22b',
          messages
        })
      });
      if (!res.ok) throw new Error('OpenRouter failed');
      const data = await res.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) throw new Error('No reply from OpenRouter');
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
}

// Main endpoint with logging and plugin-ready structure
router.post('/ai-chat', async (req, res) => {
  const { messages } = req.body;
  // Future: plugin/tooling hooks can be added here
  try {
    let reply = null;
    let engine = '';
    let attempts = 0;
    let success = false;
    const backoff = [1000, 2000, 3000];
    // Try OpenRouter first (WizardLM-2-8x22b)
    while (attempts < 3 && !success) {
      try {
        reply = await callOpenRouter(messages, req, 0);
        engine = 'openrouter';
        success = true;
      } catch (err) {
        if (attempts < 2) await new Promise(r => setTimeout(r, backoff[attempts]));
      }
      attempts++;
    }
    // Fallback to Ollama if OpenRouter fails
    if (!success) {
      attempts = 0;
      while (attempts < 3 && !success) {
        try {
          reply = await callOllama(messages, 0);
          engine = 'ollama';
          success = true;
        } catch (err) {
          if (attempts < 2) await new Promise(r => setTimeout(r, backoff[attempts]));
        }
        attempts++;
      }
    }
    if (success) {
      res.json({ reply, engine, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ reply: 'Sorry, all AI services are currently unavailable. Please try again later.', error: 'All backends failed.' });
    }
  } catch (err) {
    console.error('[AI] Unexpected error:', err.message);
    res.status(500).json({ reply: 'AI service unavailable', error: err.message });
  }
});

module.exports = router;
