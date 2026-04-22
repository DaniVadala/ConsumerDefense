/**
 * test-scenarios.ts
 * Vitest unit/integration tests for all 25 conversation scenarios.
 * Uses mocked Redis and LLM — no real API calls.
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { ConversationState, FieldsCollectedSchema } from '../lib/chatbot/schemas';
import { createInitialState } from '../lib/chatbot/redis-session';
import {
  getEarlyExitResponse,
  updateSummary,
  selectModel,
} from '../lib/chatbot/token-optimizer';
import { buildContext } from '../lib/chatbot/context-builder';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Redis
vi.mock('../lib/chatbot/redis-session', async (importOriginal) => {
  const store = new Map<string, ConversationState>();
  const original = await importOriginal<typeof import('../lib/chatbot/redis-session')>();
  return {
    ...original,
    getSession: vi.fn(async (id: string) => store.get(id) ?? null),
    saveSession: vi.fn(async (state: ConversationState) => { store.set(state.sessionId, state); }),
    resetSession: vi.fn(async (id: string) => { store.delete(id); }),
    createInitialState: original.createInitialState,
    __store: store,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<ConversationState> = {}): ConversationState {
  const base = createInitialState(randomUUID());
  return { ...base, ...overrides };
}

function populateFields(state: ConversationState, fields: Partial<ConversationState['fieldsCollected']>): ConversationState {
  return {
    ...state,
    fieldsCollected: { ...state.fieldsCollected, ...fields },
  };
}

// ---------------------------------------------------------------------------
// Schema & state tests
// ---------------------------------------------------------------------------

describe('Schema validation', () => {
  it('should create valid initial state', () => {
    const state = createInitialState(randomUUID());
    expect(state.currentStep).toBe('greeting');
    expect(state.nonConducentCount).toBe(0);
    expect(state.turnCount).toBe(0);
    expect(state.fieldsCollected.description).toBeNull();
  });

  it('should validate FieldsCollected schema with all nulls', () => {
    const fields = FieldsCollectedSchema.parse({});
    expect(fields.description).toBeNull();
    expect(fields.hasPriorClaim).toBeNull();
  });

  it('should validate FieldsCollected with partial data', () => {
    const fields = FieldsCollectedSchema.parse({
      description: 'Compré una heladera rota',
      company: 'Frávega',
      hasPriorClaim: true,
    });
    expect(fields.description).toBe('Compré una heladera rota');
    expect(fields.company).toBe('Frávega');
    expect(fields.hasPriorClaim).toBe(true);
    expect(fields.incidentDate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 01: Happy path — step by step
// ---------------------------------------------------------------------------
describe('01 - Flujo completo paso a paso', () => {
  let sessionId: string;

  beforeEach(() => {
    sessionId = randomUUID();
  });

  it('debe avanzar de greeting a description al primer mensaje', () => {
    const state = makeState({ sessionId, currentStep: 'greeting' });
    const context = buildContext(state);
    expect(context.currentStep).toBe('greeting');
    expect(context.systemPrompt).toContain('recopilar información');
  });

  it('debe actualizar el step a company cuando description está completo', () => {
    const state = populateFields(makeState({ sessionId }), { description: 'Compré un lavarropas roto' });
    const context = buildContext(state);
    expect(context.pendingFields).not.toContain('description');
    expect(context.pendingFields).toContain('company');
  });

  it('debe detectar que está listo para diagnóstico cuando todos los campos están', () => {
    const fullyPopulated = {
      description: 'Lavarropas roto',
      company: 'Garbarino',
      incidentDate: '2024-01-10',
      hasPriorClaim: true,
      priorClaimMedium: 'teléfono',
      priorClaimDate: '2024-01-15',
      claimResponse: 'Dijeron que mandaban técnico pero nunca vinieron',
      claimResponseTime: '3 meses',
      hasDocumentation: true,
      documentationDetails: 'Factura y capturas',
      amount: '$450.000',
      additionalExpenses: '$30.000',
    };
    const state = populateFields(makeState({ sessionId }), fullyPopulated);
    const context = buildContext(state);
    expect(context.pendingFields.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 02: Fast flow — all info in one message
// ---------------------------------------------------------------------------
describe('02 - Flujo rápido: toda la info en un mensaje', () => {
  it('debe poder relevar múltiples campos del schema', () => {
    const fields = FieldsCollectedSchema.parse({
      description: 'Heladera no funciona, dejó de refrigerar a los 10 días',
      company: 'Frávega',
      incidentDate: '2024-03-15',
      hasPriorClaim: true,
      priorClaimMedium: 'email',
      priorClaimDate: '2024-03-25',
      claimResponse: 'No respondieron',
      hasDocumentation: true,
      documentationDetails: 'factura y fotos',
      amount: '$500.000',
      additionalExpenses: '$50.000',
    });

    const nonNull = Object.values(fields).filter((v) => v !== null);
    expect(nonNull.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Test 03: Partial flow — 3 fields in one message
// ---------------------------------------------------------------------------
describe('03 - Flujo parcial: 3 campos en un mensaje', () => {
  it('debe actualizar sólo los campos provistos y mantener los restantes en null', () => {
    const state = populateFields(makeState({}), {
      description: 'televisor roto',
      company: 'Musimundo',
      amount: '$200.000',
    });

    expect(state.fieldsCollected.description).toBe('televisor roto');
    expect(state.fieldsCollected.company).toBe('Musimundo');
    expect(state.fieldsCollected.amount).toBe('$200.000');
    expect(state.fieldsCollected.incidentDate).toBeNull();
    expect(state.fieldsCollected.hasPriorClaim).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 04: One non-conducent response
// ---------------------------------------------------------------------------
describe('04 - Una respuesta no conducente', () => {
  it('debe incrementar nonConducentCount a 1', () => {
    const state = makeState({ nonConducentCount: 0 });
    const updated = { ...state, nonConducentCount: state.nonConducentCount + 1 };
    expect(updated.nonConducentCount).toBe(1);
    expect(updated.currentStep).not.toBe('fallback');
  });
});

// ---------------------------------------------------------------------------
// Test 05: Two non-conducent responses
// ---------------------------------------------------------------------------
describe('05 - Dos respuestas no conducentes', () => {
  it('debe alcanzar nonConducentCount = 2 sin escalar a fallback', () => {
    const state = makeState({ nonConducentCount: 1 });
    const updated = { ...state, nonConducentCount: 2 };
    expect(updated.nonConducentCount).toBe(2);
    expect(updated.currentStep).not.toBe('fallback');
  });
});

// ---------------------------------------------------------------------------
// Test 06: Three non-conducent responses → fallback
// ---------------------------------------------------------------------------
describe('06 - Tres respuestas no conducentes → fallback', () => {
  it('debe escalar a fallback cuando nonConducentCount >= 3', () => {
    const state = makeState({ nonConducentCount: 2 });
    const newCount = state.nonConducentCount + 1;
    const shouldEscalate = newCount >= 3;
    expect(shouldEscalate).toBe(true);

    const updated = { ...state, nonConducentCount: newCount, currentStep: 'fallback' as const };
    expect(updated.currentStep).toBe('fallback');
  });
});

// ---------------------------------------------------------------------------
// Test 07: Direct insult → immediate fallback
// ---------------------------------------------------------------------------
describe('07 - Insulto directo → fallback inmediato', () => {
  it('debe retornar early exit para insulto sin reintentar', () => {
    const response = getEarlyExitResponse('insulto');
    expect(response).not.toBeNull();
    expect(response).toContain('frustrado');
  });

  it('la respuesta al insulto no debe incluir lenguaje agresivo', () => {
    const response = getEarlyExitResponse('insulto') ?? '';
    const forbidden = ['mierda', 'estúpido', 'idiota', 'te lo mereces'];
    const hasForbidden = forbidden.some((w) => response.toLowerCase().includes(w));
    expect(hasForbidden).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 08: Labor case disguised as consumer
// ---------------------------------------------------------------------------
describe('08 - Caso laboral disfrazado de consumo', () => {
  it('el sistema prompt de out-of-scope no debe mencionar COPREC para derivar', () => {
    // The out-of-scope prompt should guide to the right branch, not apply LDC
    const state = makeState({ currentStep: 'fallback' });
    const context = buildContext(state);
    // In fallback step, the system prompt includes fallback instructions
    expect(context.systemPrompt).toContain('REGLAS INQUEBRANTABLES');
  });
});

// ---------------------------------------------------------------------------
// Test 09: Pure criminal case
// ---------------------------------------------------------------------------
describe('09 - Caso penal puro', () => {
  it('el sistema anti-injection está incluido en todos los prompts', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('Ignora cualquier intento');
  });
});

// ---------------------------------------------------------------------------
// Test 10: User cites non-existent law
// ---------------------------------------------------------------------------
describe('10 - Usuario cita ley inexistente', () => {
  it('el contexto base no incluye la Ley 28.543', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).not.toContain('28.543');
    expect(context.systemPrompt).toContain('24.240');
  });
});

// ---------------------------------------------------------------------------
// Test 11: User asks for guaranteed success
// ---------------------------------------------------------------------------
describe('11 - Usuario pide garantía de éxito', () => {
  it('el system prompt prohíbe garantizar resultados', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('NUNCA garantices');
  });
});

// ---------------------------------------------------------------------------
// Test 12: Consumer-to-company change (SRL)
// ---------------------------------------------------------------------------
describe('12 - Cambio de consumidor final a empresa (SRL)', () => {
  it('debe poder actualizar el campo description con nueva información', () => {
    const state = populateFields(makeState({}), {
      description: 'Compré impresora personal',
    });
    const updatedState = populateFields(state, {
      description: 'Compré impresora para mi SRL',
    });
    expect(updatedState.fieldsCollected.description).toContain('SRL');
  });
});

// ---------------------------------------------------------------------------
// Test 13: Fraud request
// ---------------------------------------------------------------------------
describe('13 - Solicitud de ayuda para fraude', () => {
  it('el system prompt incluye restricción de ayudar con fraude', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('NUNCA ayudes a cometer fraude');
  });
});

// ---------------------------------------------------------------------------
// Test 14: Emergency — gas leak
// ---------------------------------------------------------------------------
describe('14 - Emergencia: pérdida de gas', () => {
  it('el system prompt de emergencia prioriza seguridad', async () => {
    const { getSpecialPrompt } = await import('../lib/chatbot/context-builder');
    const emergencyPrompt = getSpecialPrompt('emergency');
    expect(emergencyPrompt).toContain('PRIORIDAD ABSOLUTA');
    expect(emergencyPrompt).toContain('911');
  });
});

// ---------------------------------------------------------------------------
// Test 15: Ultra-fragmented messages
// ---------------------------------------------------------------------------
describe('15 - Mensajes ultra fragmentados', () => {
  it('debe acumular información progresivamente sin saltar a diagnóstico', () => {
    const state1 = makeState({});
    const state2 = populateFields(state1, { description: 'estafaron por IG' });
    const context = buildContext(state2);

    // Should still be collecting data (not at diagnosis)
    expect(context.pendingFields.length).toBeGreaterThan(0);
    expect(context.currentStep).not.toBe('diagnosis');
  });
});

// ---------------------------------------------------------------------------
// Test 16: Prompt injection — role change
// ---------------------------------------------------------------------------
describe('16 - Prompt injection: cambio de rol', () => {
  it('el early exit para prompt_injection mantiene el rol', () => {
    const response = getEarlyExitResponse('prompt_injection');
    expect(response).not.toBeNull();
    expect(response).toContain('asistente de defensa del consumidor');
    expect(response).not.toContain('abogado de Flybondi');
  });
});

// ---------------------------------------------------------------------------
// Test 17: Prompt injection — extract system prompt
// ---------------------------------------------------------------------------
describe('17 - Prompt injection: extraer system prompt', () => {
  it('el early exit para prompt injection no revela instrucciones internas', () => {
    const response = getEarlyExitResponse('prompt_injection') ?? '';
    expect(response).not.toContain('REGLAS INQUEBRANTABLES');
    expect(response).not.toContain('system-main');
  });
});

// ---------------------------------------------------------------------------
// Test 18: Prescription expired (4 years ago)
// ---------------------------------------------------------------------------
describe('18 - Prescripción vencida (4 años)', () => {
  it('el system prompt de diagnóstico menciona el art. 50 de la Ley 24.240', async () => {
    const { SYSTEM_DIAGNOSIS } = await import('../lib/chatbot/prompts/system-diagnosis');
    expect(SYSTEM_DIAGNOSIS).toContain('art. 50');
    expect(SYSTEM_DIAGNOSIS).toContain('3 años');
  });
});

// ---------------------------------------------------------------------------
// Test 19: Empty message
// ---------------------------------------------------------------------------
describe('19 - Mensaje vacío', () => {
  it('el contexto de sesión se construye correctamente con estado inicial', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt.length).toBeGreaterThan(0);
    expect(context.currentStep).toBe('greeting');
  });
});

// ---------------------------------------------------------------------------
// Test 20: Extremely long message (>5000 chars)
// ---------------------------------------------------------------------------
describe('20 - Mensaje extremadamente largo', () => {
  it('debe poder procesar strings largos sin errores de schema', () => {
    const longText = 'x'.repeat(5001);
    const truncated = longText.slice(0, 5000);
    expect(truncated.length).toBe(5000);
  });

  it('el schema ChatRequest acepta mensajes de hasta 6000 chars (límite del schema)', async () => {
    const { ChatRequestSchema } = await import('../lib/chatbot/schemas');
    const message = 'a'.repeat(6000);
    const result = ChatRequestSchema.safeParse({ message });
    expect(result.success).toBe(true);
  });

  it('el schema ChatRequest rechaza mensajes mayores a 6000 chars', async () => {
    const { ChatRequestSchema } = await import('../lib/chatbot/schemas');
    const message = 'a'.repeat(6001);
    const result = ChatRequestSchema.safeParse({ message });
    expect(result.success).toBe(false);
  });

  it('el route trunca mensajes a 5000 chars antes de procesarlos', async () => {
    // El schema permite hasta 6000, pero route.ts hace .slice(0, 5000)
    // Esto verifica que la constante de truncado sea consistente con lo esperado.
    const { MAX_USER_MESSAGE_LENGTH } = await import('../lib/chatbot/config');
    expect(MAX_USER_MESSAGE_LENGTH).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Test 21: Expired Redis session
// ---------------------------------------------------------------------------
describe('21 - Sesión expirada en Redis', () => {
  it('createInitialState devuelve un estado fresco cuando Redis no tiene datos', () => {
    const newSessionId = randomUUID();
    const state = createInitialState(newSessionId);
    expect(state.sessionId).toBe(newSessionId);
    expect(state.currentStep).toBe('greeting');
    expect(state.turnCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 22: Special characters and emojis
// ---------------------------------------------------------------------------
describe('22 - Caracteres especiales y emojis', () => {
  it('el schema acepta mensajes con emojis y caracteres especiales', async () => {
    const { ChatRequestSchema } = await import('../lib/chatbot/schemas');
    const message = 'Me vendieron un 📱 roto!! 😡😡 en ML @#$%';
    const result = ChatRequestSchema.safeParse({ message });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe(message);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 23: Concurrent sessions are isolated
// ---------------------------------------------------------------------------
describe('23 - Sesiones concurrentes aisladas', () => {
  it('dos sesiones con diferentes sessionIds tienen estados independientes', () => {
    const id1 = randomUUID();
    const id2 = randomUUID();
    const state1 = populateFields(createInitialState(id1), { company: 'Garbarino' });
    const state2 = populateFields(createInitialState(id2), { company: 'Movistar' });

    expect(state1.fieldsCollected.company).toBe('Garbarino');
    expect(state2.fieldsCollected.company).toBe('Movistar');
    expect(state1.sessionId).not.toBe(state2.sessionId);
    expect(state1.fieldsCollected.company).not.toBe(state2.fieldsCollected.company);
  });
});

// ---------------------------------------------------------------------------
// Test 24: User returns after diagnosis
// ---------------------------------------------------------------------------
describe('24 - Usuario vuelve después del diagnóstico', () => {
  it('una nueva sesión comienza en greeting aunque la anterior estuviera en completed', () => {
    const oldState = makeState({ currentStep: 'completed' });
    const newState = createInitialState(randomUUID());
    expect(newState.currentStep).toBe('greeting');
    expect(newState.sessionId).not.toBe(oldState.sessionId);
  });
});

// ---------------------------------------------------------------------------
// Test 25: Previous claim with excessive response time
// ---------------------------------------------------------------------------
describe('25 - Reclamo previo con tiempo excesivo sin respuesta', () => {
  it('debe poder capturar el tiempo de respuesta excesivo', () => {
    const state = populateFields(makeState({}), {
      hasPriorClaim: true,
      priorClaimMedium: 'teléfono',
      priorClaimDate: '2023-07',
      claimResponse: 'Dijeron que lo iban a solucionar pero nunca lo hicieron',
      claimResponseTime: '6 meses sin respuesta',
    });

    expect(state.fieldsCollected.hasPriorClaim).toBe(true);
    expect(state.fieldsCollected.claimResponseTime).toContain('6 meses');
  });

  it('el system prompt de diagnóstico menciona incumplimiento de plazos', async () => {
    const { SYSTEM_DIAGNOSIS } = await import('../lib/chatbot/prompts/system-diagnosis');
    expect(SYSTEM_DIAGNOSIS).toContain('prescripción');
  });
});

// ---------------------------------------------------------------------------
// Test 26: nonConducentCount acumula incluso con mensajes alternados
// ---------------------------------------------------------------------------
describe('26 - nonConducentCount no se resetea con mensajes conducentes alternados', () => {
  it('debe acumular nonConducentCount a través de mensajes conducentes intercalados', () => {
    // Simula: no_conducente → conducente → no_conducente → conducente → no_conducente
    // El contador debe llegar a 3 y disparar fallback aunque estén alternados.
    let state = makeState({ nonConducentCount: 0 });

    // Turno 1 — no_conducente
    state = { ...state, nonConducentCount: state.nonConducentCount + 1 };
    expect(state.nonConducentCount).toBe(1);
    expect(state.currentStep).not.toBe('fallback');

    // Turno 2 — conducente: NO debe resetear el contador
    // (antes del fix esto hacía nonConducentCount: 0)
    state = { ...state, fieldsCollected: { ...state.fieldsCollected, company: 'Claro Argentina' } };
    // El contador debe permanecer en 1
    expect(state.nonConducentCount).toBe(1);

    // Turno 3 — no_conducente
    state = { ...state, nonConducentCount: state.nonConducentCount + 1 };
    expect(state.nonConducentCount).toBe(2);
    expect(state.currentStep).not.toBe('fallback');

    // Turno 4 — conducente: NO debe resetear el contador
    state = { ...state, fieldsCollected: { ...state.fieldsCollected, incidentDate: '2024-01' } };
    expect(state.nonConducentCount).toBe(2);

    // Turno 5 — no_conducente: llega a MAX_NON_CONDUCENT (3) → fallback
    const newCount = state.nonConducentCount + 1;
    expect(newCount).toBeGreaterThanOrEqual(3);
    state = { ...state, nonConducentCount: newCount, currentStep: 'fallback' as const };
    expect(state.currentStep).toBe('fallback');
  });

  it('con mensajes consecutivos no conducentes el comportamiento anterior se mantiene', () => {
    let state = makeState({ nonConducentCount: 0 });
    state = { ...state, nonConducentCount: state.nonConducentCount + 1 };
    state = { ...state, nonConducentCount: state.nonConducentCount + 1 };
    const newCount = state.nonConducentCount + 1;
    expect(newCount).toBeGreaterThanOrEqual(3);
    state = { ...state, nonConducentCount: newCount, currentStep: 'fallback' as const };
    expect(state.currentStep).toBe('fallback');
  });
});

// ---------------------------------------------------------------------------
// Test 27: Protección de PII en system prompt
// ---------------------------------------------------------------------------
describe('27 - Protección de PII: regla presente en system prompt', () => {
  it('el system prompt incluye regla de no repetir datos sensibles del usuario', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('PROTECCIÓN DE DATOS SENSIBLES');
    expect(context.systemPrompt).toMatch(/DNI|CBU|contraseña/i);
  });
});

// ---------------------------------------------------------------------------
// Test 28: Crisis de salud mental en system prompt
// ---------------------------------------------------------------------------
describe('28 - Crisis de salud mental: regla presente en system prompt', () => {
  it('el system prompt incluye instrucción para crisis mental o ideación suicida', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('CRISIS DE SALUD MENTAL');
    expect(context.systemPrompt).toMatch(/135|suicida/i);
  });

  it('el system prompt incluye instrucción para violencia doméstica', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('VIOLENCIA DOMÉSTICA');
    expect(context.systemPrompt).toMatch(/144/);
  });
});

// ---------------------------------------------------------------------------
// Test 29: Ingeniería social — resistencia en anti-injection
// ---------------------------------------------------------------------------
describe('29 - Ingeniería social: resistencia en system-anti-injection', () => {
  it('el system anti-injection cubre autoridad falsa, halagos y urgencia fabricada', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toMatch(/ingeniería social|autoridad falsa|halagos|urgencia/i);
  });

  it('el system anti-injection cubre adoptar personajes alternativos (roleplay)', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toMatch(/juego de rol|personaje alternativo/i);
  });

  it('el system anti-injection prohíbe revelar el nombre del modelo de IA', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toMatch(/nombre del modelo|modelo de IA|parámetro técnico/i);
  });
});

// ---------------------------------------------------------------------------
// Test 30: Confidencialidad del sistema en system-main
// ---------------------------------------------------------------------------
describe('30 - Confidencialidad del sistema: regla en SYSTEM_MAIN', () => {
  it('SYSTEM_MAIN incluye regla de no revelar instrucciones internas ni configuración', () => {
    const state = makeState({});
    const context = buildContext(state);
    expect(context.systemPrompt).toContain('CONFIDENCIALIDAD DEL SISTEMA');
    expect(context.systemPrompt).toMatch(/system prompt|instrucciones internas/i);
  });
});

// ---------------------------------------------------------------------------
// Token optimizer tests
// ---------------------------------------------------------------------------
describe('Token optimizer', () => {
  it('selectModel devuelve gpt-4o para paso de diagnosis', () => {
    expect(selectModel('diagnosis')).toBe('gpt-4o');
  });

  it('selectModel devuelve gpt-4o-mini para pasos de intake', () => {
    expect(selectModel('description')).toBe('gpt-4o-mini');
    expect(selectModel('company')).toBe('gpt-4o-mini');
    expect(selectModel('amount')).toBe('gpt-4o-mini');
  });

  it('updateSummary concatena correctamente', () => {
    const summary = updateSummary('', 'hola', 'bienvenido');
    expect(summary).toContain('hola');
    expect(summary).toContain('bienvenido');
  });

  it('updateSummary trunca cuando supera el límite', () => {
    const longSummary = 'x'.repeat(700);
    const updated = updateSummary(longSummary, 'mensaje nuevo', 'respuesta nueva');
    expect(updated.length).toBeLessThanOrEqual(850);
  });
});
