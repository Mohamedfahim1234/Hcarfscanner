import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function getScanExplanation(scanResults: any) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key missing');
  const systemPrompt = `You are a cybersecurity assistant for a SaaS scanner. You must never suggest exploits, never expose secrets, and always enforce ethical boundaries. Only explain risks and remediation in a professional, non-malicious way.`;
  const userPrompt = `Explain the following scan results for a domain, focusing on risk and remediation only.\n${JSON.stringify(scanResults, null, 2)}`;
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.2
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
}
