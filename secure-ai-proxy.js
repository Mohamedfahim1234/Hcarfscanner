const express = require('express');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(express.json());

// Rate limiting: 10 requests/minute per IP
app.use('/chat', rateLimit({ windowMs: 60 * 1000, max: 10 }));

app.post('/chat', async (req, res) => {
  const { messages, model = 'wizardlm/WizardLM-2-8x22b' } = req.body;
  try {
    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages })
    });
    const data = await aiRes.json();
    res.json({ reply: data.choices?.[0]?.message?.content || 'No reply.' });
  } catch (err) {
    res.status(500).json({ reply: 'AI service unavailable.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('AI proxy running'));
