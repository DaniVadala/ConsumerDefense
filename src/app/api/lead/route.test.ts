import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { POST } from './route';

const validBody = {
  nombre: 'Juan Pérez',
  telefono: '1144556677',
  email: 'juan@ejemplo.com',
  problema: 'Me cobraron de más en mi factura de internet por varios meses consecutivos.',
};

function makeRequest(body: unknown, ip = '1.2.3.4') {
  return new Request('http://localhost/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/lead', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('retorna 200 con datos válidos', async () => {
    const res = await POST(makeRequest(validBody, '10.0.0.1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('retorna 400 cuando el nombre es demasiado corto', async () => {
    const res = await POST(makeRequest({ ...validBody, nombre: 'A' }, '10.0.0.2'));
    expect(res.status).toBe(400);
  });

  it('retorna 400 cuando el problema es demasiado corto', async () => {
    const res = await POST(makeRequest({ ...validBody, problema: 'muy corto' }, '10.0.0.3'));
    expect(res.status).toBe(400);
  });

  it('retorna 400 con email inválido', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'no-es-un-email' }, '10.0.0.4'));
    expect(res.status).toBe(400);
  });

  it('escapa HTML en el email de notificación para prevenir XSS', async () => {
    const xssBody = {
      nombre: '<script>alert("xss")</script>',
      telefono: '1144556677',
      problema: '<img src=x onerror=alert(1)> Problema de consumo suficientemente largo para pasar la validación.',
    };
    await POST(makeRequest(xssBody, '10.0.0.5'));
    const sentHtml: string = mockSend.mock.calls[0][0].html;
    expect(sentHtml).not.toContain('<script>');
    expect(sentHtml).toContain('&lt;script&gt;');
    expect(sentHtml).not.toContain('<img');
    expect(sentHtml).toContain('&lt;img');
  });

  it('retorna 429 al superar el rate limit', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(validBody, ip));
    }
    const res = await POST(makeRequest(validBody, ip));
    expect(res.status).toBe(429);
  });
});
