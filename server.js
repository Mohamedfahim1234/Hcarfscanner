// Express server for /api/chat endpoint with OpenAI GPT-4o context-aware assistant
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, scanContext, systemPrompt } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided.' });

  // Compose context for the assistant
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

  const messages = [
    { role: 'system', content: systemPrompt || 'You are a helpful assistant for a domain leak scanner platform. Only explain, never scan.' },
    { role: 'user', content: `${contextText}\nUser: ${message}` }
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages,
      max_tokens: 400,
      temperature: 0.6
    });
    const reply = completion.data.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message);
    res.status(500).json({ reply: 'Sorry, the AI service is currently unavailable.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HCARF-Scanner AI backend running on port ${PORT}`);
});
