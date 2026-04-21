/**
 * Tests the fields_extracted round-trip:
 *  1. Unknown company (not in regex) — LLM should still identify it
 *  2. Second turn with returned fields_extracted — status block should show ✓ empresa
 *  3. Verify immediate diagnosis when threshold met via LLM extraction
 */
const http = require('http');

function post(body) {
  const data = JSON.stringify(body);
  const options = {
    hostname: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  };
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let b = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (b += c));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch { reject(new Error('Bad JSON: ' + b.slice(0, 200))); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n══ TEST 1: Unknown company — LLM must identify via comprehension ══');
  const t1 = await post({
    messages: [
      { role: 'user', content: 'Hola, la empresa CosmoCorp S.R.L. me vendió un producto defectuoso el 5 de febrero, pagué $50.000 y tengo la factura. Ya les mandé un mail reclamando y no respondieron.' },
    ],
    locale: 'es',
    fieldsExtracted: null,
  });
  console.log('ACTION:', t1.action);
  console.log('fields_extracted.empresa:', t1.fields_extracted?.empresa);
  console.log('fields_extracted.fecha_hechos:', t1.fields_extracted?.fecha_hechos);
  console.log('fields_extracted.monto:', t1.fields_extracted?.monto);
  console.log('fields_extracted.reclamo_previo:', t1.fields_extracted?.reclamo_previo);
  console.log('fields_extracted.documentacion:', t1.fields_extracted?.documentacion);
  if (t1.action === 'diagnosis') {
    console.log('✅ Immediate diagnosis — all fields identified by LLM');
  } else {
    console.log('text:', t1.text?.slice(0, 150));
  }

  console.log('\n══ TEST 2: Send fields_extracted back — 2nd turn should not re-ask empresa ══');
  // Simulate: Turn 1 LLM identified empresa="CosmoCorp S.R.L." but action=message
  // Turn 2 user adds more context — with incoming fields_extracted, status should show ✓ empresa
  const mockExtracted = t1.fields_extracted ?? { empresa: 'CosmoCorp S.R.L.', fecha_hechos: '5 de febrero', monto: '$50.000', reclamo_previo: true, documentacion: true };
  const t2 = await post({
    messages: [
      { role: 'user', content: 'CosmoCorp me vendió un producto defectuoso el 5 de febrero, pagué $50.000 y tengo la factura. Les mandé un mail reclamando.' },
      { role: 'assistant', content: t1.action === 'message' ? t1.text : '¿Querés que genere el análisis?' },
      { role: 'user', content: 'Sí, por favor.' },
    ],
    locale: 'es',
    fieldsExtracted: mockExtracted,
  });
  console.log('ACTION:', t2.action);
  const askEmpresa = t2.text && /empresa|proveedor|compañía|marca/i.test(t2.text) && !/CosmoCorp/i.test(t2.text ?? '');
  console.log('Re-asked for empresa?', askEmpresa ? '❌ YES (bad)' : '✅ NO');
  if (t2.action === 'diagnosis') console.log('✅ Diagnosis triggered on turn 2');
  else console.log('text (turn 2):', t2.text?.slice(0, 150));

  console.log('\n══ TEST 3: Regex company (Aerolíneas) first turn — still works ══');
  const t3 = await post({
    messages: [
      { role: 'user', content: 'Aerolíneas Argentinas me canceló el vuelo el 13 de marzo, son 3000 USD, tengo los mails y el pasaje.' },
    ],
    locale: 'es',
    fieldsExtracted: null,
  });
  console.log('ACTION:', t3.action);
  console.log('fields_extracted.empresa:', t3.fields_extracted?.empresa);
  if (t3.action === 'diagnosis') console.log('✅ Immediate diagnosis');
  else console.log('text:', t3.text?.slice(0, 100));
}

run().catch(console.error);
