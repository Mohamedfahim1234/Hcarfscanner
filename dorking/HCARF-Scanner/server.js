
  async function tryOllama() {
    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      if (!ollamaRes.ok) throw new Error(`Ollama error: ${ollamaRes.status}`);
      const data = await ollamaRes.json();
      if (data.message && data.message.content) return data.message.content.trim();
      if (data.done && data.done.content) return data.done.content.trim();
      throw new Error('Ollama: No valid response');
    } catch (err) {
      logError('Ollama failed', err);
      return null;
    }
  }

  // Helper: try OpenRouter
  async function tryOpenRouter() {
    if (!OPENROUTER_API_KEY) {
      logError('OpenRouter API key missing');
      return { error: 'OPENROUTER_API_KEY_MISSING' };
    }
    try {
      const routerRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 400,
          temperature: 0.6
        })
      });
      if (!routerRes.ok) throw new Error(`OpenRouter error: ${routerRes.status}`);
      const data = await routerRes.json();
      if (data.choices && data.choices[0]?.message?.content) return data.choices[0].message.content.trim();
      throw new Error('OpenRouter: No valid response');
    } catch (err) {
      logError('OpenRouter failed', err);
      return null;
    }
  }

  // Helper: try OpenAI
  async function tryOpenAI() {
    if (!openai) return null;
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages,
        max_tokens: 400,
        temperature: 0.6
      });
      return completion.data.choices[0].message.content.trim();
    } catch (err) {
      logError('OpenAI failed', err.response?.data || err.message);
      return null;
    }
  }

  // Main retry/fallback logic
  let reply = null;
  let fallback = null;
  // 1. Try Ollama (twice)
  reply = await tryOllama();
  if (!reply) reply = await tryOllama();
  // 2. If Ollama fails, try OpenRouter (twice)
  if (!reply) {
    const or1 = await tryOpenRouter();
    if (or1 && typeof or1 === 'object' && or1.error === 'OPENROUTER_API_KEY_MISSING') {
      return res.status(400).json({ error: 'OpenRouter API key missing. Please set OPENROUTER_API_KEY in your .env.' });
    }
    reply = or1;
    if (!reply) {
      const or2 = await tryOpenRouter();
      if (or2 && typeof or2 === 'object' && or2.error === 'OPENROUTER_API_KEY_MISSING') {
        return res.status(400).json({ error: 'OpenRouter API key missing. Please set OPENROUTER_API_KEY in your .env.' });
      }
      reply = or2;
    }
    fallback = 'openrouter';
  }
  // 3. If OpenRouter fails, try OpenAI (if available)
  if (!reply && openai) {
    reply = await tryOpenAI();
    fallback = 'openai';
  }

  if (!reply) {
    logError('All AI chat backends failed');
    return res.status(500).json({ error: 'All AI chat services are unavailable.' });
  }
  res.json({ reply, fallback });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HCARF-Scanner AI backend running on port ${PORT}`);
});
