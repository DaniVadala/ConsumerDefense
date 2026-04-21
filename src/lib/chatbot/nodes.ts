// src/lib/chatbot/nodes.ts
/**
 * Nodos del grafo LangGraph.
 * El código controla el flujo. El LLM se invoca solo cuando hace falta.
 */

import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  GraphStateType,
  AREAS,
  AreaKey,
  LEGISLACION_POR_AREA,
  DISCLAIMER,
  getDisclaimer,
  DiagnosticoData,
} from './state';
import {
  getNextQuestion,
  canGenerateDiagnosis,
  canGeneratePreliminaryDiagnosis,
  getSuggestedDocs,
  getTotalQuestionsForArea,
  computePasoInfo,
  DOCS_ES,
  DOCS_EN,
} from './questions';
import { buildAreaList, getAllAreaLabels, getAreaLabel, str } from './chat-strings';
import { sanitizeForPrompt, detectInjection, detectFueraConsumoQuick, detectAbuse, classifyShortMessage, respuestaParaMensajeCorto, truncateField } from '@/lib/ai/input-guard';
import { filtrarOutputEstricto } from '@/lib/ai/output-guard';
import { getEmpatiaApertura, getEmpatiaPrevioDiagnostico } from './empathy';
import { getStatsParaDiagnostico, statsToText } from './stats';
import { detectarUrgencia, detectarMenorDeEdad } from './urgency-detector';
import { getSystemPrompt } from '@/lib/ai/prompts';

// ============================================================
// MODELOS
// ============================================================

const modelExtraction = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: 220,
  temperature: 0.1,
});

const modelDiagnostico = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: 500,
  temperature: 0.3,
});

// ============================================================
// UTILIDADES
// ============================================================

function generateCasoId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DY-${year}-${rand}`;
}

function fastAreaHint(text: string): AreaKey | null {
  const t = text.toLowerCase();
  if (/\b(personal|claro|movistar|telecentro|fibertel|arnet|wifi|internet|celular|tel[eé]fono|roaming|datos\s+m[oó]viles)\b/.test(t))
    return 'telecomunicaciones';
  if (/\b(banco|tarjeta|visa|mastercard|galicia|santander|naranja|mercado\s*pago|ualá|brubank|débito|d[ée]bito|resumen|veraz|BCRA)\b/.test(t))
    return 'financiero';
  if (/\b(fr[áa]vega|garbarino|musimundo|samsung|LG|whirlpool|heladera|lavarropas|televisor|garant[ií]a\s+(del\s+)?(producto|electro))\b/.test(t))
    return 'electrodomesticos';
  if (/\b(mercado\s*libre|tiendanube|instagram|compra\s+online|comprad[a|o]\s+por\s+internet|ecommerce|shopify|tienda\s+online)\b/.test(t))
    return 'ecommerce';
  if (/\b(osde|swiss\s*medical|galeno|medicus|prepaga|obra\s+social|apross|ioma|seguro\s+(de\s+)?(auto|hogar|vida))\b/.test(t))
    return 'seguros_prepaga';
  if (/\b(edenor|edesur|epec|luz|electricidad|gas\s+(natural|de\s+red)|aguas\s+cordobesas|agua\s+potable)\b/.test(t))
    return 'servicios_publicos';
  if (/\b(aerol[ií]neas|LATAM|flybondi|jetsmart|despegar|almundo|booking|vuelo|aeropuerto|equipaje|paquete\s+tur[ií]stico)\b/.test(t))
    return 'turismo_aereo';
  return null;
}

interface ExtractedInfo {
  area?: AreaKey;
  proveedor?: string;
  problema?: string;
  tiempo?: string;
  reclamoPrevio?: boolean;
  esFueraDeConsumo?: boolean;
  esInadecuado?: boolean;
}

async function extractInfoFromText(userText: string, locale: string = 'es'): Promise<ExtractedInfo> {
  const safe = sanitizeForPrompt(userText);
  const prompt = `Analizá el siguiente mensaje y detectá si es inadecuado o fuera de tema de defensa del consumidor en Argentina.

<user_input>
${safe}
</user_input>

Respondé SOLO con JSON:
{
  "esInadecuado": boolean,
  "esFueraDeConsumo": boolean,
  "area": "telecomunicaciones|financiero|electrodomesticos|ecommerce|seguros_prepaga|servicios_publicos|turismo_aereo|otros_consumo|null",
  "proveedor": "empresa o null",
  "problema": "resumen en máx 15 palabras o null",
  "tiempo": "tiempo o null",
  "reclamoPrevio": "true|false|null"
}`;

  try {
    const response = await modelExtraction.invoke([
      new SystemMessage(getSystemPrompt('ROUTER', locale)),
      new HumanMessage(prompt),
    ]);

    const text = typeof response.content === 'string'
      ? response.content
      : (response.content as Array<{ text?: string }>).map((c) => c.text || '').join('');

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { esFueraDeConsumo: true };
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      area: parsed.area && parsed.area !== 'null' ? (parsed.area as AreaKey) : undefined,
      proveedor: parsed.proveedor && parsed.proveedor !== 'null' ? truncateField(String(parsed.proveedor), 'proveedor') : undefined,
      problema: parsed.problema && parsed.problema !== 'null' ? truncateField(String(parsed.problema), 'problema') : undefined,
      tiempo: parsed.tiempo && parsed.tiempo !== 'null' ? truncateField(String(parsed.tiempo), 'tiempo') : undefined,
      reclamoPrevio: parsed.reclamoPrevio === true ? true : parsed.reclamoPrevio === false ? false : undefined,
      esFueraDeConsumo: parsed.esFueraDeConsumo === true,
      esInadecuado: parsed.esInadecuado === true,
    };
  } catch (error) {
    console.error('Error parsing user text:', error);
    return { esFueraDeConsumo: true };
  }
}

interface PreProcessResult {
  textoSaneado: string;
  esInjection: boolean;
  injectionLabels: string[];
  tipoMensajeCorto: ReturnType<typeof classifyShortMessage>;
  urgencia: ReturnType<typeof detectarUrgencia>;
  esMenor: boolean;
  esFueraConsumoQuick: boolean;
  esAbuso: boolean;
}

function preProcess(userText: string): PreProcessResult {
  const textoSaneado = sanitizeForPrompt(userText);
  const injection = detectInjection(userText);
  const tipoMensajeCorto = classifyShortMessage(textoSaneado);
  const urgencia = detectarUrgencia(textoSaneado);
  const esMenor = detectarMenorDeEdad(textoSaneado);
  const esFueraConsumoQuick = detectFueraConsumoQuick(textoSaneado);
  const esAbuso = detectAbuse(textoSaneado);
  return {
    textoSaneado,
    esInjection: injection.detected,
    injectionLabels: injection.labels,
    tipoMensajeCorto,
    urgencia,
    esMenor,
    esFueraConsumoQuick,
    esAbuso,
  };
}

// ============================================================
// NODO: SALUDO
// ============================================================

export async function saludoNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const rawMsg = state.lastUserMessage.trim();
  const pre = preProcess(rawMsg);

  if (pre.esInjection) {
    return {
      currentNode: 'saludo',
      injectionDetectada: true,
      responseText: str(state.locale, 'outOfScope'),
      uiComponents: [{ type: 'areaSelector', areas: buildAreaList(state.locale) }],
      turnCount: state.turnCount + 1,
    };
  }

  // 1b. Matching directo de click en pill de área (en cualquier idioma)
  const areaKeyDirect = Object.keys(AREAS).find(k => {
    const allLabels = getAllAreaLabels(k as AreaKey).map(l => l.toLowerCase());
    return allLabels.includes(rawMsg.toLowerCase()) || k === rawMsg;
  }) as AreaKey | undefined;
  if (areaKeyDirect) {
    const newCaptured = { ...state.captured, area: areaKeyDirect, areaConfirmada: true };
    const firstQ = getNextQuestion(areaKeyDirect, 0, capturedToRecord(newCaptured), state.locale);
    const pasoInfo = computePasoInfo(areaKeyDirect, 0, capturedToRecord(newCaptured));
    return {
      currentNode: 'intake',
      captured: newCaptured,
      intakeStep: 0,
      responseText: getEmpatiaApertura(areaKeyDirect, state.captured.problemaTextoLibre, state.locale),
      uiComponents: firstQ ? [{ type: 'intakeQuestion', pregunta: firstQ.pregunta, opciones: firstQ.opciones, tipoInput: firstQ.tipoInput, placeholder: firstQ.placeholder, ...pasoInfo }] : [],
      turnCount: state.turnCount + 1,
    };
  }

  // 1c. IA GUARD (Para cualquier mensaje que no sea un saludo corto muy obvio)
  if (pre.tipoMensajeCorto === 'none' || pre.esAbuso || pre.esFueraConsumoQuick) {
    const extracted = await extractInfoFromText(pre.textoSaneado, state.locale);

    if (extracted.esInadecuado || pre.esAbuso) {
      return {
        currentNode: 'saludo',
        responseText: str(state.locale, 'respectRequest'),
        uiComponents: [{ type: 'whatsappCTA', casoId: '', area: 'Inadecuado', proveedor: '', resumen: 'Usuario ofensivo' }],
        turnCount: state.turnCount + 1,
      };
    }

    if (extracted.esFueraDeConsumo || pre.esFueraConsumoQuick) {
      return {
        currentNode: 'fallback',
        temaFueraDeConsumo: state.temaFueraDeConsumo + 1,
        responseText: str(state.locale, 'outOfScope'),
        uiComponents: [{ type: 'whatsappCTA', casoId: '', area: 'Fuera de tema', proveedor: '', resumen: pre.textoSaneado.slice(0, 50) }],
        turnCount: state.turnCount + 1,
      };
    }

    // Si la IA encontró un área, procedemos
    const area = fastAreaHint(pre.textoSaneado) || extracted.area;
    if (area) {
      const newCaptured = {
        ...state.captured,
        area,
        areaConfirmada: true,
        proveedor: extracted.proveedor,
        problemaTextoLibre: pre.textoSaneado,
        problemaPrincipal: extracted.problema,
        tiempo: extracted.tiempo,
        // No pre-populate reclamoPrevio — let intake ask the user directly
      };

      const firstQ = getNextQuestion(area, 0, capturedToRecord(newCaptured), state.locale);
      const pasoInfo = computePasoInfo(area, 0, capturedToRecord(newCaptured));
      return {
        currentNode: 'intake',
        captured: newCaptured,
        intakeStep: 0,
        responseText: getEmpatiaApertura(area, pre.textoSaneado, state.locale),
        uiComponents: firstQ ? [{ type: 'intakeQuestion', pregunta: firstQ.pregunta, opciones: firstQ.opciones, tipoInput: firstQ.tipoInput, placeholder: firstQ.placeholder, ...pasoInfo }] : [],
        turnCount: state.turnCount + 1,
      };
    }
  }

  // 2. MENSAJE CORTO (Saludo, etc)
  if (pre.tipoMensajeCorto !== 'none') {
    const resp = respuestaParaMensajeCorto(pre.tipoMensajeCorto, state.locale);
    return {
      currentNode: 'saludo',
      responseText: resp || str(state.locale, 'areaPrompt'),
      uiComponents: [{ type: 'areaSelector', areas: buildAreaList(state.locale) }],
      turnCount: state.turnCount + 1,
    };
  }

  // Fallback: mostrar selector
  return {
    currentNode: 'clasificacion',
    responseText: str(state.locale, 'areaPrompt'),
    uiComponents: [{ type: 'areaSelector', areas: buildAreaList(state.locale) }],
    turnCount: state.turnCount + 1,
  };
}

// ============================================================
// NODO: CLASIFICACIÓN
// ============================================================

export async function clasificacionNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const rawMsg = state.lastUserMessage.trim();
  const pre = preProcess(rawMsg);

  // Click exacto en botón — comparar contra labels en todos los idiomas
  const areaKey = Object.keys(AREAS).find(k => {
    const allLabels = getAllAreaLabels(k as AreaKey).map(l => l.toLowerCase());
    return allLabels.includes(rawMsg.toLowerCase()) || k === rawMsg;
  }) as AreaKey | undefined;
  if (areaKey) {
    const newCaptured = { ...state.captured, area: areaKey, areaConfirmada: true };
    const firstQ = getNextQuestion(areaKey, 0, capturedToRecord(newCaptured), state.locale);
    const pasoInfo = computePasoInfo(areaKey, 0, capturedToRecord(newCaptured));
    return {
      currentNode: 'intake',
      captured: newCaptured,
      intakeStep: 0,
      responseText: getEmpatiaApertura(areaKey, state.captured.problemaTextoLibre, state.locale),
      uiComponents: firstQ ? [{ type: 'intakeQuestion', pregunta: firstQ.pregunta, opciones: firstQ.opciones, tipoInput: firstQ.tipoInput, placeholder: firstQ.placeholder, ...pasoInfo }] : [],
      turnCount: state.turnCount + 1,
    };
  }

  // IA GUARD para todo lo demás
  const extracted = await extractInfoFromText(pre.textoSaneado, state.locale);
  if (extracted.esInadecuado || pre.esAbuso) {
    return { currentNode: 'clasificacion', responseText: str(state.locale, 'respectRequest'), uiComponents: [{ type: 'whatsappCTA', casoId: '', area: 'Inadecuado', proveedor: '', resumen: 'Abuso' }], turnCount: state.turnCount + 1 };
  }
  if (extracted.esFueraDeConsumo || pre.esFueraConsumoQuick) {
    return { currentNode: 'fallback', responseText: str(state.locale, 'outOfScopeRepeated'), uiComponents: [{ type: 'whatsappCTA', casoId: '', area: 'Fuera de tema', proveedor: '', resumen: pre.textoSaneado.slice(0, 50) }], turnCount: state.turnCount + 1 };
  }

  if (extracted.area) {
    const newCaptured = { ...state.captured, area: extracted.area, areaConfirmada: true, problemaTextoLibre: pre.textoSaneado };
    const firstQ = getNextQuestion(extracted.area, 0, capturedToRecord(newCaptured), state.locale);
    const pasoInfo = computePasoInfo(extracted.area, 0, capturedToRecord(newCaptured));
    return {
      currentNode: 'intake',
      captured: newCaptured,
      intakeStep: 0,
      responseText: getEmpatiaApertura(extracted.area, pre.textoSaneado, state.locale),
      uiComponents: firstQ ? [{ type: 'intakeQuestion', pregunta: firstQ.pregunta, opciones: firstQ.opciones, tipoInput: firstQ.tipoInput, placeholder: firstQ.placeholder, ...pasoInfo }] : [],
      turnCount: state.turnCount + 1,
    };
  }

  return {
    currentNode: 'clasificacion',
    responseText: str(state.locale, 'areaRetry'),
    uiComponents: [{ type: 'areaSelector', areas: buildAreaList(state.locale) }],
    turnCount: state.turnCount + 1,
  };
}

// ============================================================
// NODO: INTAKE
// ============================================================

export async function intakeNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const rawMsg = state.lastUserMessage.trim();
  const pre = preProcess(rawMsg);
  const area = state.captured.area!;

  // AI Guard + extraction combinados — evita falsos positivos en nombres cortos
  // como "Claro" (empresa), "OSDE", "marzo", "$5000", etc.
  let extracted: ExtractedInfo | null = null;
  if (pre.esAbuso || pre.esFueraConsumoQuick || rawMsg.length > 30) {
    extracted = rawMsg.length > 30
      ? await extractInfoFromText(pre.textoSaneado, state.locale)
      : { esInadecuado: pre.esAbuso, esFueraDeConsumo: pre.esFueraConsumoQuick };
    if (extracted.esInadecuado || extracted.esFueraDeConsumo || pre.esAbuso || pre.esFueraConsumoQuick) {
      return {
        currentNode: 'fallback',
        responseText: extracted.esInadecuado ? str(state.locale, 'respectRequest') : str(state.locale, 'outOfScope'),
        uiComponents: [{ type: 'whatsappCTA', casoId: '', area: AREAS[area], proveedor: '', resumen: 'Desvío detectado' }],
        turnCount: state.turnCount + 1,
      };
    }
  }

  const wantsLawyer = /\b(abogado|hablar\s+con\s+alguien|persona\s+real|humano|contacten|lawyer|attorney|speak\s+to\s+someone)\b/i;
  if (wantsLawyer.test(rawMsg)) {
    return { currentNode: 'fallback', responseText: str(state.locale, 'connectLawyerPolite'), uiComponents: [{ type: 'fallbackWhatsApp', contexto: 'Usuario pidió abogado' }], turnCount: state.turnCount + 1 };
  }

  const updatedCaptured = { ...state.captured };
  let progressed = false;
  const currentQuestion = getNextQuestion(area, state.intakeStep, capturedToRecord(state.captured));

  if (currentQuestion) {
    const campo = currentQuestion.campo;
    const safeAnswer = truncateField(pre.textoSaneado, campo as string);
    switch (campo) {
      case 'problema': updatedCaptured.problemaPrincipal = safeAnswer; progressed = true; break;
      case 'proveedor': updatedCaptured.proveedor = safeAnswer; progressed = true; break;
      case 'tiempo': updatedCaptured.tiempo = safeAnswer; progressed = true; break;
      case 'monto': updatedCaptured.monto = safeAnswer; progressed = true; break;
      case 'reclamoPrevio': {
        const lower = rawMsg.toLowerCase().trim();
        const realizado = /^s[ií]\b|^yes\b|\breclamé\b|\bmandé\b|\benvié\b|\bpresenté\b/.test(lower) && !/^no\b/.test(lower);
        updatedCaptured.reclamoPrevio = { realizado, conNumero: false };
        progressed = true;
        break;
      }
      case 'detalleReclamo': updatedCaptured.detalleReclamo = safeAnswer; progressed = true; break;
      case 'documentacion':
        updatedCaptured.documentacion = safeAnswer ? safeAnswer.split('|||').map(s => s.trim()).filter(Boolean) : [];
        progressed = true;
        break;
    }

    // Pre-fill upcoming empty campos from the same message when possible.
    // Only for free-text answers — checklist answers are discrete selections.
    if (extracted && currentQuestion.tipoInput !== 'checklist') {
      if (currentQuestion.campo !== 'proveedor' && !updatedCaptured.proveedor && extracted.proveedor)
        updatedCaptured.proveedor = extracted.proveedor;
      if (currentQuestion.campo !== 'tiempo' && !updatedCaptured.tiempo && extracted.tiempo)
        updatedCaptured.tiempo = extracted.tiempo;
      if (currentQuestion.campo !== 'problema' && !updatedCaptured.problemaPrincipal && extracted.problema)
        updatedCaptured.problemaPrincipal = extracted.problema;
      if (currentQuestion.campo !== 'reclamoPrevio' && !updatedCaptured.reclamoPrevio && extracted.reclamoPrevio !== undefined)
        updatedCaptured.reclamoPrevio = { realizado: extracted.reclamoPrevio, conNumero: false };
    }
  }

  if (!progressed && state.turnosSinProgreso >= 2) {
    return { currentNode: 'fallback', responseText: str(state.locale, 'noProgressFallback'), uiComponents: [{ type: 'fallbackWhatsApp', contexto: 'Sin progreso en intake' }], turnCount: state.turnCount + 1 };
  }

  const nextStep = progressed ? state.intakeStep + 1 : state.intakeStep;
  const nextQ = getNextQuestion(area, nextStep, capturedToRecord(updatedCaptured), state.locale);

  if (!nextQ) {
    return { currentNode: 'diagnostico', captured: updatedCaptured, turnCount: state.turnCount + 1 };
  }

  return {
    currentNode: 'intake',
    captured: updatedCaptured,
    intakeStep: nextStep,
    turnosSinProgreso: progressed ? 0 : state.turnosSinProgreso + 1,
    uiComponents: [{ type: 'intakeQuestion', pregunta: nextQ.pregunta, placeholder: nextQ.placeholder, opciones: nextQ.opciones, tipoInput: nextQ.tipoInput, ...computePasoInfo(area, nextStep, capturedToRecord(updatedCaptured)) }],
    turnCount: state.turnCount + 1,
  };
}

// (Resto de nodos diagnosticoNode y urgenciaNode se mantienen iguales estructuralmente)

function computeMissingDocs(area: AreaKey, documentacion: string[] | undefined, locale: string): string[] {
  const allDocs = locale === 'en' ? DOCS_EN[area] : DOCS_ES[area];
  if (!allDocs) return getSuggestedDocs(area, locale);
  if (!documentacion || documentacion.length === 0) return allDocs;
  return allDocs.filter(doc => !documentacion.includes(doc));
}

function computeFortalezaDocumental(documentacion: string[] | undefined, locale: string): string {
  const count = documentacion?.length ?? 0;
  if (count === 0) return locale === 'en' ? 'Weak — no documentation available' : 'Débil — sin documentación disponible';
  if (count >= 3) return locale === 'en' ? 'Strong — multiple documents available' : 'Sólida — documentación múltiple disponible';
  return locale === 'en' ? 'Partial — some documentation available' : 'Parcial — documentación básica disponible';
}

export async function diagnosticoNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  const area = state.captured.area!;
  const legislacion = LEGISLACION_POR_AREA[area] || ['Ley 24.240'];
  const casoId = generateCasoId();
  const notSpecified = str(state.locale, 'notSpecified');
  const diagnosticoData: DiagnosticoData = {
    casoId,
    area: getAreaLabel(area, state.locale),
    proveedor: state.captured.proveedor || notSpecified,
    problemaPrincipal: state.captured.problemaPrincipal || state.captured.problemaTextoLibre || notSpecified,
    tiempo: state.captured.tiempo || notSpecified,
    reclamoPrevio: state.captured.reclamoPrevio || { realizado: false, conNumero: false },
    ...(state.captured.monto && { monto: state.captured.monto }),
    legislacionAplicable: legislacion,
    fortalezaDocumental: computeFortalezaDocumental(state.captured.documentacion, state.locale),
    documentacionSugerida: computeMissingDocs(area, state.captured.documentacion, state.locale),
    disclaimer: getDisclaimer(state.locale),
  };

  return {
    currentNode: 'cierre',
    casoId,
    diagnosticoData,
    responseText: str(state.locale, 'diagIntro'),
    uiComponents: [{ type: 'diagnostico', data: diagnosticoData }],
    turnCount: state.turnCount + 1,
  };
}

export async function urgenciaNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  return {
    currentNode: 'cierre',
    responseText: str(state.locale, 'urgencyIntro'),
    uiComponents: [{ type: 'urgencia', motivo: 'Urgencia detectada', recurso: 'WhatsApp DefensaYa', contacto: '5493515284074' }],
    turnCount: state.turnCount + 1,
  };
}

function capturedToRecord(captured: GraphStateType['captured']): Record<string, unknown> {
  return { area: captured.area, proveedor: captured.proveedor, problema: captured.problemaPrincipal, tiempo: captured.tiempo, monto: captured.monto, reclamoPrevio: captured.reclamoPrevio, detalleReclamo: captured.detalleReclamo, documentacion: captured.documentacion };
}
