const fs = require('fs');
const path = require('path');

function findLatestDump(logsDir) {
  if (!fs.existsSync(logsDir)) return null;
  const files = fs.readdirSync(logsDir).filter(f => f.startsWith('groq-result-') && f.endsWith('.json'));
  if (!files.length) return null;
  files.sort((a,b) => fs.statSync(path.join(logsDir,b)).mtime - fs.statSync(path.join(logsDir,a)).mtime);
  return path.join(logsDir, files[0]);
}

(async function main(){
  try {
    const logsDir = path.join(process.cwd(), '.next', 'dev', 'logs');
    const dump = findLatestDump(logsDir);
    if (!dump) {
      console.error('No diagnostic dump found in', logsDir);
      process.exit(2);
    }
    console.log('Using dump:', dump);
    const content = JSON.parse(fs.readFileSync(dump, 'utf8'));
    const requestBodyRaw = content?.result?.request?.body;
    if (!requestBodyRaw) {
      console.error('Dump does not contain request.body');
      process.exit(3);
    }

    const bodyObj = JSON.parse(requestBodyRaw);

    const envPath = path.join(process.cwd(), '.env.local');
    let apiKey = process.env.GROQ_API_KEY;
    if (!apiKey && fs.existsSync(envPath)) {
      const envRaw = fs.readFileSync(envPath,'utf8');
      const match = envRaw.match(/^GROQ_API_KEY\s*=\s*(.*)$/m);
      if (match) {
        apiKey = match[1].replace(/^['\"]|['\"]$/g,'');
      }
    }
    if (!apiKey) {
      console.error('GROQ_API_KEY not found');
      process.exit(4);
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    console.log('Replaying request to Groq with body:', JSON.stringify(bodyObj, null, 2));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(bodyObj)
    });

    const text = await res.text();
    console.log('HTTP', res.status, res.statusText);
    try {
      console.log('RESPONSE JSON', JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log('RESPONSE RAW', text);
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
