

// Clean, single backend for secure AI chat
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

function logError(message, error) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message} ${error ? (typeof error === 'string' ? error : JSON.stringify(error)) : ''}`;
  fs.appendFile('chat_error.log', logMsg + '\n', () => {});
  console.error(logMsg);
}

// --- SECURE AI PROVIDER ROUTE: /api/ask-ai (env-driven) ---
app.post('/api/ask-ai', async (req, res) => {
  const { message, scanContext } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided.' });

  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) return res.status(500).json({ error: 'AI provider API key not configured.' });

  const SYSTEM_PROMPT = `You are HCARF AI Assistant. You must never access or discuss API keys or environment variables. Only assist with scan results, security issues, and protection tips.`;

  let contextText = '';
  if (scanContext) {
    contextText += `Domain: ${scanContext.domain || ''}\n`;
    if (scanContext.results && scanContext.results.length > 0) {
      contextText += `Scan Results (summarized):\n`;
      scanContext.results.slice(0, 5).forEach((r, i) => {
        contextText += `- [${r.platform}] ${r.title} (${r.risk}) - ${r.link}\n`;
      });
    }
    if (scanContext.corsVulnerabilities && scanContext.corsVulnerabilities.length > 0) {
      contextText += `CORS Vulnerabilities: ${scanContext.corsVulnerabilities.length}\n`;
    }
    if (scanContext.errors && scanContext.errors.length > 0) {
      contextText += `Errors: ${scanContext.errors.length}\n`;
    }
    if (scanContext.failureReasons && scanContext.failureReasons.length > 0) {
      contextText += `Failure Reasons: ${scanContext.failureReasons.map(r => r.type).join(', ')}\n`;
    }
  }
  const userPrompt = `${contextText}\nUser: ${message}`;
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  try {
    let aiResponse = null;
    if (provider === 'openai') {
      try {
        const openaiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages,
            max_tokens: 400,
            temperature: 0.6
          },
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000 // 30 second timeout
          }
        );
        aiResponse = openaiRes.data.choices[0].message.content.trim();
      } catch (err) {
        if (err.response?.status === 401) {
          logError('OpenAI authentication failed', err.response.data);
          return res.status(401).json({ error: 'Invalid OpenAI API key.' });
        } else if (err.response?.status === 429) {
          logError('OpenAI rate limit exceeded', err.response.data);
          return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        } else {
          throw err;
        }
      }
    } else if (provider === 'openrouter') {
      try {
        const routerRes = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4',
            messages,
            max_tokens: 400,
            temperature: 0.6
          },
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000 // 30 second timeout
          }
        );
        aiResponse = routerRes.data.choices[0].message.content.trim();
      } catch (err) {
        if (err.response?.status === 401) {
          logError('OpenRouter authentication failed', err.response.data);
          return res.status(401).json({ error: 'Invalid OpenRouter API key.' });
        } else if (err.response?.status === 429) {
          logError('OpenRouter rate limit exceeded', err.response.data);
          return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        } else {
          throw err;
        }
      }
    } else {
      return res.status(400).json({ error: 'Unsupported AI provider.' });
    }
    res.json({ reply: aiResponse });
  } catch (err) {
    logError('AI provider error', err?.response?.data || err.message);
    const errorMessage = err?.response?.data?.error || err.message || 'An unexpected error occurred.';
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} using ${process.env.AI_PROVIDER}`);
});
// Express server for /api/chat endpoint with OpenAI GPT-4o context-aware assistant
