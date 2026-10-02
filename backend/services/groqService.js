const TIMEOUT = Number(process.env.GROQ_TIMEOUT_MS || 30000);
const RETRIES = Number(process.env.GROQ_MAX_RETRIES || 2);

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function extractJson(text) {
  if (!text) throw new Error('Empty Groq response');
  const clean = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(clean);
}
function validateSelection(data, allowed) {
  if (!data || typeof data !== 'object') throw new Error('Invalid AI object');
  const valid = (ids, set) => Array.isArray(ids) ? ids.map(Number).filter(id => set.has(id)) : [];
  return {
    hotelId: allowed.hotels.has(Number(data.hotelId)) ? Number(data.hotelId) : null,
    restaurantIds: valid(data.restaurantIds, allowed.restaurants),
    attractionIds: valid(data.attractionIds, allowed.attractions),
    transportationIds: valid(data.transportationIds, allowed.transportation),
    explanation: typeof data.explanation === 'string' ? data.explanation.slice(0, 1200) : '',
    tips: Array.isArray(data.tips) ? data.tips.filter(x => typeof x === 'string').slice(0, 8) : []
  };
}
async function callGroq({ system, user, allowed }) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(user) }]
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || `Groq HTTP ${response.status}`);
      const parsed = extractJson(body.choices?.[0]?.message?.content);
      return validateSelection(parsed, allowed);
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await delay(400 * (attempt + 1));
    } finally { clearTimeout(timer); }
  }
  throw lastError;
}

async function callChat({ message, destinations }) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Answer only from the supplied TripGenie destination records. Return JSON with an answer string and destinationIds array. Do not invent prices, destinations or availability.' },
          { role: 'user', content: JSON.stringify({ message, destinations }) }
        ]
      })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message || `Groq HTTP ${response.status}`);
    const parsed = extractJson(body.choices?.[0]?.message?.content);
    const allowed = new Set(destinations.map(d => d.id));
    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer.slice(0, 2500) : '',
      destinationIds: Array.isArray(parsed.destinationIds) ? parsed.destinationIds.map(Number).filter(id => allowed.has(id)) : []
    };
  } finally { clearTimeout(timer); }
}
module.exports = { callGroq, callChat };
