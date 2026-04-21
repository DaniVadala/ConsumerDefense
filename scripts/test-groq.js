const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    // strip optional quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[m[1]] = val;
  }
  return env;
}

(async function main(){
  const envPath = path.join(process.cwd(), '.env.local');
  const env = loadEnvFile(envPath);
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY not found in process.env or .env.local');
    process.exit(2);
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Please respond with a short greeting.' }
    ],
    temperature: 0
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('HTTP', res.status, res.statusText);
    try {
      console.log('BODY', JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log('RAW BODY', text);
    }
  } catch (e) {
    console.error('Request failed:', e);
    process.exit(3);
  }
})();
