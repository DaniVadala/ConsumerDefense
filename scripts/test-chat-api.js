/**
 * Integration test for the new /api/chat endpoint
 * Tests: message flow, diagnosis generation, off-topic (whatsapp), and bilingual support
 */

const http = require('http');

function callApi(messages, locale) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ messages, locale });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Non-JSON response: ' + body.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function assert(condition, msg) {
  if (!condition) {
    console.error('  FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('  PASS:', msg);
  }
}

(async () => {
  console.log('\n=== Chat API Integration Tests ===\n');

  // Test 1: Single message → should ask follow-up question
  console.log('1. Single message → should return action:message');
  const r1 = await callApi([{ role: 'user', content: 'me cobraron de mas en la tarjeta' }], 'es');
  assert(r1.action === 'message', 'action should be message (still collecting info)');
  assert(typeof r1.text === 'string' && r1.text.length > 5, 'text should be non-empty');
  assert(r1.diagnosis === null, 'diagnosis should be null when still collecting');

  // Test 2: Full conversation → should return diagnosis
  console.log('\n2. Full conversation → should return action:diagnosis');
  const r2 = await callApi(
    [
      { role: 'user', content: 'Me cobraron de mas en la tarjeta de credito' },
      { role: 'assistant', content: 'Con que banco fue y de cuanto fue el cargo extra?' },
      { role: 'user', content: 'Banco Galicia, enero 2026, me cobraron 5000 pesos de mas' },
      { role: 'assistant', content: 'Hiciste algun reclamo ante el banco?' },
      {
        role: 'user',
        content:
          'Si, llame al banco hace 2 semanas y no me respondieron. Tengo el extracto bancario y capturas de la app.',
      },
    ],
    'es'
  );
  assert(r2.action === 'diagnosis', 'action should be diagnosis after collecting all info');
  assert(typeof r2.text === 'string' && r2.text.length > 10, 'text should be non-empty');
  if (r2.action === 'diagnosis') {
    assert(!!r2.diagnosis, 'diagnosis object should be present');
    assert(typeof r2.diagnosis.empresa === 'string', 'empresa field present');
    assert(typeof r2.diagnosis.area === 'string', 'area field present');
    assert(Array.isArray(r2.diagnosis.pasos_siguientes), 'pasos_siguientes is array');
    assert(
      r2.diagnosis.pasos_siguientes.some((s) => s.includes('argentina.gob.ar')),
      'official URL present in pasos_siguientes'
    );
    assert(Array.isArray(r2.diagnosis.tipos_danos), 'tipos_danos is array');
    assert(Array.isArray(r2.diagnosis.normativa), 'normativa is array');
    assert(
      r2.diagnosis.normativa.some((n) => n.includes('24.240')),
      'Ley 24.240 present in normativa'
    );
    console.log('  AREA:', r2.diagnosis.area);
    console.log('  EMPRESA:', r2.diagnosis.empresa);
    console.log('  NIVEL:', r2.diagnosis.nivel_prueba);
    console.log('  PASOS:', r2.diagnosis.pasos_siguientes.length, 'steps');
  }

  // Test 3: Off-topic message → should return action:whatsapp
  console.log('\n3. Off-topic message → should return action:whatsapp');
  const r3 = await callApi([{ role: 'user', content: 'what is the weather in Buenos Aires?' }], 'es');
  assert(r3.action === 'whatsapp', 'off-topic should trigger whatsapp action');
  assert(typeof r3.text === 'string' && r3.text.length > 5, 'text should explain the limitation');

  // Test 4: EN locale → should respond in English
  console.log('\n4. EN locale → should respond in English');
  const r4 = await callApi(
    [
      { role: 'user', content: 'My flight was cancelled and the airline refused to refund me' },
      { role: 'assistant', content: 'Which airline was it? And when was the flight?' },
      { role: 'user', content: 'Aerolineas Argentinas, February 2026. I complained but no response in a month. I have the ticket and the cancellation email.' },
    ],
    'en'
  );
  assert(['message', 'diagnosis'].includes(r4.action), 'EN should return valid action');
  assert(typeof r4.text === 'string' && r4.text.length > 5, 'EN text should be non-empty');
  if (r4.action === 'diagnosis' && r4.diagnosis) {
    console.log('  EN AREA:', r4.diagnosis.area);
    console.log('  EN NIVEL:', r4.diagnosis.nivel_prueba);
  }

  console.log('\n=== Tests complete ===');
})();
