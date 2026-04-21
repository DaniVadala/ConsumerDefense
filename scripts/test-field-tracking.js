const http = require('http');

function call(label, messages) {
  const data = JSON.stringify({ messages, locale: 'es' });
  const options = {
    hostname: 'localhost', port: 3000, path: '/api/chat', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  };
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const j = JSON.parse(body);
        console.log(`\n── ${label} ──`);
        console.log('ACTION:', j.action);
        if (j.action === 'diagnosis') {
          console.log('  nivel_prueba:', j.diagnosis?.nivel_prueba);
          console.log('  empresa:', j.diagnosis?.empresa);
          console.log('  plazos estado:', j.diagnosis?.plazos?.estado);
          console.log('  plazos vencimiento:', j.diagnosis?.plazos?.vencimiento);
          console.log('  ✅ DIAGNOSIS — no follow-up questions asked');
        } else {
          console.log('  text:', j.text?.slice(0, 200));
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.error(label, e.message); resolve(); });
    req.write(data);
    req.end();
  });
}

async function run() {
  // ── Test 1: Exact user scenario — all 6 fields in first message ──
  await call('TEST 1: All fields in first message → must diagnose immediately', [
    {
      role: 'user',
      content:
        'Tenía un vuelo el 13 de marzo a las 15 hs me lo cancelaron a las 13 comunicandomelo por mail. ' +
        'El dinero perdido es el del pasaje por 2000 USD mas hoteles que debi pagar durante 3 días por 1000 USD. ' +
        'Reclame el reembolso varias veces tengo los mails. La empresa, aerolineas argentinas, me dice que no puede reembolsar ese valor o ningun otro. ' +
        'Tengo el pasaje, el intercambio de mails, las facturas del hotel.',
    },
  ]);

  // ── Test 2: Partial first message, then user provides remaining info ──
  await call('TEST 2: empresa + desc only → should ask one question', [
    { role: 'user', content: 'Aerolineas Argentinas me cancelo el vuelo y no me quieren reembolsar.' },
  ]);

  // ── Test 3: Enterprise + 2 optional fields already → diagnose ──
  await call('TEST 3: empresa + desc + fecha + monto → must diagnose immediately', [
    { role: 'user', content: 'El 13 de marzo Aerolineas Argentinas me cancelo el vuelo. Son 3000 USD en total.' },
  ]);

  // ── Test 4: User re-asked after already providing reclamo ──
  await call('TEST 4: Bot already asked reclamo, user answered → NO repeat', [
    { role: 'user', content: 'Aerolineas Argentinas me cancelo el vuelo el 13 de marzo, 3000 USD, tengo factura.' },
    { role: 'assistant', content: '¿Hiciste algún reclamo previo?' },
    { role: 'user', content: 'Si, mande mails varias veces.' },
  ]);
}

run();
