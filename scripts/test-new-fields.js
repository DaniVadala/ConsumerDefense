const http = require('http');

const msgs = [
  {
    role: 'user',
    content:
      'Hola, quiero hacer un reclamo. El 15 de marzo de 2025 compré un lavarropas en Frávega, se rompió a los 2 meses y no me lo arreglaron después de 3 visitas técnicas. Tengo factura y los tickets de servicio técnico. Ya hice reclamo formal por escrito y no respondieron.',
  },
];

const ports = [3000, 3001];
let port = ports[0];

function run(port) {
  const data = JSON.stringify({ messages: msgs, locale: 'es' });
  const options = {
    hostname: 'localhost',
    port,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  };
  const req = http.request(options, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      const j = JSON.parse(body);
      console.log('PORT:', port, '| ACTION:', j.action);
      if (j.diagnosis) {
        console.log('nivel_prueba:', j.diagnosis.nivel_prueba);
        console.log('nivel_prueba_explicacion:', j.diagnosis.nivel_prueba_explicacion);
        console.log('plazos.estado:', j.diagnosis.plazos?.estado);
        console.log('plazos.vencimiento:', j.diagnosis.plazos?.vencimiento);
        console.log('plazos.base_legal:', j.diagnosis.plazos?.base_legal);
        console.log('plazos.explicacion:', j.diagnosis.plazos?.explicacion);
      } else {
        console.log('text:', j.text);
      }
    });
  });
  req.on('error', (e) => {
    if (port === 3000) {
      console.log('Port 3000 failed, trying 3001…');
      run(3001);
    } else {
      console.error('ERROR:', e.message);
    }
  });
  req.write(data);
  req.end();
}

run(3000);
