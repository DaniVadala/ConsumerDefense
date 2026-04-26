# Tarea: Flujo híbrido — texto libre + formulario adaptativo + diagnóstico LLM

## Visión general

Reemplazar el chat conversacional actual por un flujo de 3 fases:

```
FASE 1 — Texto libre (1 mensaje del usuario)
FASE 2 — Extracción LLM (generateObject, una llamada, sin stream)
FASE 3 — Formulario adaptativo (solo los steps faltantes, con stepper)
FASE 4 — Merge de datos (TypeScript puro)
FASE 5 — Diagnóstico LLM (streamText, una sola llamada)
FASE 6 — Resultado en pantalla
```

El LLM interviene exactamente dos veces: extracción y diagnóstico.
El estado del formulario lo maneja React con useState — sin LLM, sin API.
No hay conversación, no hay re-preguntas, no hay loops.

---

## Archivos a crear

- `src/lib/chat/intake-extractor.ts` — extracción con generateObject
- `src/components/chat/FreeTextStep.tsx` — fase 1: input de texto libre
- `src/components/chat/ExtractedSummary.tsx` — fase 3: resumen de lo detectado
- `src/components/chat/IntakeForm.tsx` — fase 3: formulario adaptativo con stepper
- `src/app/api/intake-extract/route.ts` — endpoint de extracción (Fase 2)

## Archivos a modificar

- `src/app/api/chat/route.ts` — simplificar para solo diagnóstico
- `src/lib/prompts/consumidor-chat-instructions.md` — reescribir para solo diagnóstico
- Página principal del chat (buscar el archivo que renderiza el chat)

## Archivos a eliminar

```bash
rm src/lib/chat/intake-orchestrator.ts
rm src/lib/chat/intake-directive.ts
rm src/lib/chat/intake-validator.ts
rm src/lib/chat/inventory-extractor.ts
```

`intake-pills-tool.ts` y `whatsapp-handoff-tool.ts` mantenerlos por si
se usan en otras partes del proyecto, pero ya no se pasan al streamText.

---

## PASO 1 — Crear `src/lib/chat/intake-extractor.ts`

```typescript
/**
 * intake-extractor.ts
 *
 * Extrae los 8 campos del caso a partir del texto libre del usuario.
 * Usa generateObject con schema Zod estricto y temperature=0.
 * Devuelve null para los campos que no están en el texto.
 */
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const ExtractionSchema = z.object({
  step1: z.string().nullable().describe(
    'Descripcion del hecho o reclamo. null si no se menciona.'
  ),
  step2: z.string().nullable().describe(
    'Nombre de la empresa o proveedor involucrado. null si no se menciona.'
  ),
  step3: z.string().nullable().describe(
    'Fecha o periodo en que ocurrio (mes, año, "hace dos meses", etc.). null si no se menciona.'
  ),
  step4: z.enum(['si', 'no', 'no_recuerda']).nullable().describe(
    'Si hubo reclamo previo. si=reclamo confirmado, no=sin reclamo, no_recuerda=no sabe. null si no se menciona.'
  ),
  step5: z.string().nullable().describe(
    'Medios por los que reclamo (mail, telefono, OMIC, etc.). null si step4 no es "si" o no se menciona.'
  ),
  step6: z.string().nullable().describe(
    'Respuesta de la empresa al reclamo. null si no se menciona.'
  ),
  step7: z.string().nullable().describe(
    'Provincia argentina donde se haria el reclamo. null si no se menciona.'
  ),
  step8: z.string().nullable().describe(
    'Monto del daño o reclamo (cifra, rango, o "no se"). null si no se menciona.'
  ),
});

export type ExtractedAnswers = z.infer<typeof ExtractionSchema>;

// ---------------------------------------------------------------------------
// System prompt del extractor
// ---------------------------------------------------------------------------

const EXTRACTOR_SYSTEM = `Sos un extractor de datos estructurados. Analizas el texto de un usuario
que describe un problema de defensa del consumidor y extraes los datos que
aparecen explicitamente en el texto.

REGLAS CRITICAS:
1. Solo extraes lo que esta EXPLICITO en el texto. No inferis, no completas,
   no adivinas.
2. Si un dato no esta en el texto → devolver null para ese campo.
3. step5 (medios de reclamo) solo puede tener valor si step4 es "si".
4. step6 (respuesta empresa) solo puede tener valor si step4 es "si".
5. Para step4: "no me respondieron" o "no responden" NO significa que no
   hizo reclamo — significa que SI reclamo pero no obtuvo respuesta.
   En ese caso step4="si" y step6="no respondio".
6. Para step7: reconocer variantes ("cordoba", "caba", "buenos aires",
   "gba", "bsas", etc.) y normalizar al nombre oficial.
7. Para step8: extraer la cifra o rango tal como aparece. Si dice
   "no se el monto" → "No sabe el monto exacto".

EJEMPLOS:

Texto: "Me cancelaron un vuelo en abril del 2025. Reclame por mail en mayo
pero no me responden. Quiero reclamar en Cordoba por 1 millon de pesos."
→ step1: "Cancelacion de vuelo"
→ step2: null (no menciono empresa)
→ step3: "Abril 2025"
→ step4: "si"
→ step5: "Mail"
→ step6: "No respondieron"
→ step7: "Córdoba"
→ step8: "ARS 1.000.000"

Texto: "Banco Galicia me cobro un cargo que no corresponde"
→ step1: "Cobro de cargo indebido"
→ step2: "Banco Galicia"
→ step3: null
→ step4: null
→ step5: null
→ step6: null
→ step7: null
→ step8: null

Devuelve SOLO el JSON valido segun el schema. Sin texto adicional.`;

// ---------------------------------------------------------------------------
// Funcion principal
// ---------------------------------------------------------------------------

export async function extractFromFreeText(
  text: string
): Promise<ExtractedAnswers> {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { object } = await generateObject({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'),
    schema: ExtractionSchema,
    system: EXTRACTOR_SYSTEM,
    prompt: `Extraer datos del siguiente texto:\n\n"${text}"`,
    temperature: 0,
  });

  return object;
}

// ---------------------------------------------------------------------------
// Helper: calcular steps faltantes
// ---------------------------------------------------------------------------

export type StepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8';

export function getPendingSteps(
  extracted: ExtractedAnswers
): StepKey[] {
  const allSteps: StepKey[] = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8'];

  return allSteps.filter(key => {
    // step5 y step6 solo son pendientes si step4='si'
    if ((key === 'step5' || key === 'step6') && extracted.step4 !== 'si') {
      return false;
    }
    return extracted[key] === null;
  });
}

// ---------------------------------------------------------------------------
// Helper: mergear extraido con formulario
// Los datos del formulario tienen prioridad (el usuario puede corregir)
// ---------------------------------------------------------------------------

export function mergeAnswers(
  extracted: ExtractedAnswers,
  formAnswers: Partial<ExtractedAnswers>
): ExtractedAnswers {
  return {
    step1: formAnswers.step1 ?? extracted.step1,
    step2: formAnswers.step2 ?? extracted.step2,
    step3: formAnswers.step3 ?? extracted.step3,
    step4: formAnswers.step4 ?? extracted.step4,
    step5: formAnswers.step5 ?? extracted.step5,
    step6: formAnswers.step6 ?? extracted.step6,
    step7: formAnswers.step7 ?? extracted.step7,
    step8: formAnswers.step8 ?? extracted.step8,
  };
}

// ---------------------------------------------------------------------------
// Helper: armar el mensaje para el LLM de diagnostico
// ---------------------------------------------------------------------------

export function buildDiagnosisPrompt(answers: ExtractedAnswers): string {
  const step4Label = answers.step4 === 'si'
    ? 'Sí'
    : answers.step4 === 'no'
    ? 'No'
    : answers.step4 === 'no_recuerda'
    ? 'No recuerda'
    : 'No informado';

  return `Datos del caso recolectados:

1. Descripción del hecho: ${answers.step1 ?? 'No informado'}
2. Empresa o proveedor: ${answers.step2 ?? 'No informado'}
3. Fecha o período: ${answers.step3 ?? 'No informado'}
4. Reclamo previo: ${step4Label}
5. Medios del reclamo: ${answers.step5 ?? 'No aplica'}
6. Respuesta de la empresa: ${answers.step6 ?? 'No aplica'}
7. Provincia: ${answers.step7 ?? 'No informado'}
8. Monto: ${answers.step8 ?? 'No informado'}

Emitir el diagnóstico completo según el formato del system prompt.`;
}
```

---

## PASO 2 — Crear `src/app/api/intake-extract/route.ts`

Endpoint liviano que recibe el texto libre y devuelve el objeto extraído
y los steps pendientes. No hace stream — responde JSON.

```typescript
import { NextRequest } from 'next/server';
import {
  extractFromFreeText,
  getPendingSteps,
} from '@/lib/chat/intake-extractor';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.text || typeof body.text !== 'string') {
      return Response.json({ error: 'Texto requerido' }, { status: 400 });
    }

    if (body.text.trim().length < 5) {
      return Response.json({ error: 'Texto demasiado corto' }, { status: 400 });
    }

    const extracted = await extractFromFreeText(body.text);
    const pendingSteps = getPendingSteps(extracted);

    console.log('[intake-extract] extracted:', JSON.stringify(extracted));
    console.log('[intake-extract] pending:', pendingSteps);

    return Response.json({ extracted, pendingSteps });
  } catch (err) {
    console.error('[intake-extract] error:', err);
    return Response.json({ error: 'Error al procesar el texto' }, { status: 500 });
  }
}
```

---

## PASO 3 — Crear `src/components/chat/FreeTextStep.tsx`

Fase 1: input de texto libre donde el usuario cuenta su caso.

```tsx
'use client';

import { useState } from 'react';

interface FreeTextStepProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function FreeTextStep({ onSubmit, isLoading }: FreeTextStepProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (text.trim().length < 10) {
      setError('Contanos un poco más sobre tu caso.');
      return;
    }
    setError('');
    onSubmit(text.trim());
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-4 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-gray-900">
          Contanos qué pasó
        </h2>
        <p className="text-sm text-gray-500">
          Describí tu caso con el detalle que tengas. Cuanto más informes,
          menos preguntas adicionales necesitaremos.
        </p>
      </div>

      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
        onKeyDown={e => {
          if (e.key === 'Enter' && e.metaKey) handleSubmit();
        }}
        placeholder="Ej: Mercado Libre no me entregó un paquete que compré en marzo. Reclamé por mail pero no me responden. Tengo la factura y los mails. El producto costó $80.000..."
        rows={5}
        disabled={isLoading}
        className="border border-gray-300 rounded-lg px-4 py-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
          disabled:opacity-50"
        autoFocus
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isLoading || text.trim().length < 10}
        className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
          font-medium hover:bg-blue-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Analizando...' : 'Continuar →'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Podés escribir todo junto — detectamos automáticamente los datos.
      </p>
    </div>
  );
}
```

---

## PASO 4 — Crear `src/components/chat/ExtractedSummary.tsx`

Muestra al usuario qué datos fueron detectados automáticamente y cuántos
steps faltan. Le confirma que su texto fue leído.

```tsx
'use client';

import type { ExtractedAnswers, StepKey } from '@/lib/chat/intake-extractor';

const STEP_LABELS: Record<StepKey, string> = {
  step1: 'Descripción del hecho',
  step2: 'Empresa o proveedor',
  step3: 'Fecha o período',
  step4: 'Reclamo previo',
  step5: 'Medios del reclamo',
  step6: 'Respuesta de la empresa',
  step7: 'Provincia',
  step8: 'Monto',
};

interface ExtractedSummaryProps {
  extracted: ExtractedAnswers;
  pendingSteps: StepKey[];
  onContinue: () => void;
}

export function ExtractedSummary({
  extracted,
  pendingSteps,
  onContinue,
}: ExtractedSummaryProps) {
  const completedSteps = (Object.keys(STEP_LABELS) as StepKey[]).filter(
    k => extracted[k] !== null && !pendingSteps.includes(k)
  );

  // Si no hay nada pendiente, llamar onContinue automáticamente
  // (esto lo maneja la página padre — ver PASO 6)

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto px-4 py-6">

      {completedSteps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-sm font-medium text-green-800">
            ✅ Detectamos estos datos en tu relato:
          </p>
          <ul className="flex flex-col gap-1">
            {completedSteps.map(key => (
              <li key={key} className="text-sm text-green-700">
                <span className="font-medium">{STEP_LABELS[key]}:</span>{' '}
                {String(extracted[key])}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingSteps.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Solo {pendingSteps.length === 1
              ? 'necesitamos un dato más'
              : `necesitamos ${pendingSteps.length} datos más`}{' '}
            para generar tu análisis.
          </p>
          <button
            onClick={onContinue}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
              font-medium hover:bg-blue-700 transition-colors"
          >
            Completar →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Tenemos toda la información necesaria para tu análisis.
          </p>
          <button
            onClick={onContinue}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm
              font-medium hover:bg-blue-700 transition-colors"
          >
            Ver análisis →
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## PASO 5 — Crear `src/components/chat/IntakeForm.tsx`

Formulario adaptativo. Solo recibe los steps pendientes y los muestra
en orden con stepper. Si no hay steps pendientes, no se renderiza.

```tsx
'use client';

import { useState } from 'react';
import type { ExtractedAnswers, StepKey } from '@/lib/chat/intake-extractor';

// ---------------------------------------------------------------------------
// Configuración de steps
// ---------------------------------------------------------------------------

interface StepConfig {
  key: StepKey;
  question: string;
  type: 'text' | 'textarea' | 'pills_single' | 'pills_multi' | 'province' | 'amount';
  options?: Array<{ id: string; label: string }>;
  placeholder?: string;
  minLength?: number;
}

const STEP_CONFIGS: Record<StepKey, StepConfig> = {
  step1: {
    key: 'step1',
    question: '¿Qué pasó? Describí brevemente el problema.',
    type: 'textarea',
    placeholder: 'Ej: Me cancelaron el vuelo sin aviso...',
    minLength: 10,
  },
  step2: {
    key: 'step2',
    question: '¿Qué empresa o proveedor está involucrado?',
    type: 'text',
    placeholder: 'Ej: Aerolíneas Argentinas, Banco Galicia...',
  },
  step3: {
    key: 'step3',
    question: '¿Cuándo ocurrió aproximadamente?',
    type: 'text',
    placeholder: 'Ej: Abril 2025, hace dos meses...',
  },
  step4: {
    key: 'step4',
    question: '¿Hiciste algún reclamo previo?',
    type: 'pills_single',
    options: [
      { id: 'si', label: 'Sí, reclamé' },
      { id: 'no', label: 'No reclamé' },
      { id: 'no_recuerda', label: 'No recuerdo' },
    ],
  },
  step5: {
    key: 'step5',
    question: '¿Por qué medios reclamaste?',
    type: 'pills_multi',
    options: [
      { id: 'mail', label: 'Mail' },
      { id: 'whatsapp', label: 'WhatsApp' },
      { id: 'telefono', label: 'Teléfono' },
      { id: 'presencial', label: 'Presencial' },
      { id: 'omic', label: 'OMIC' },
      { id: 'coprec', label: 'COPREC' },
      { id: 'carta', label: 'Carta documento' },
      { id: 'verbal', label: 'Solo verbal' },
    ],
  },
  step6: {
    key: 'step6',
    question: '¿Qué te respondió la empresa?',
    type: 'pills_single',
    options: [
      { id: 'no_respondio', label: 'No respondió' },
      { id: 'rechazo', label: 'Rechazó el reclamo' },
      { id: 'parcial', label: 'Ofreció solución parcial' },
      { id: 'tardo', label: 'Resolvió pero tardó mucho' },
      { id: 'otra', label: 'Otra respuesta' },
    ],
  },
  step7: {
    key: 'step7',
    question: '¿En qué provincia harías el reclamo?',
    type: 'province',
  },
  step8: {
    key: 'step8',
    question: '¿Cuál es el monto aproximado del daño o reclamo?',
    type: 'amount',
    placeholder: 'Ej: 150000',
  },
};

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface IntakeFormProps {
  pendingSteps: StepKey[];
  onComplete: (formAnswers: Partial<ExtractedAnswers>) => void;
}

export function IntakeForm({ pendingSteps, onComplete }: IntakeFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formAnswers, setFormAnswers] = useState<Partial<ExtractedAnswers>>({});
  const [textInput, setTextInput] = useState('');
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  const totalSteps = pendingSteps.length;
  const currentKey = pendingSteps[currentIndex];
  const currentConfig = STEP_CONFIGS[currentKey];
  const progressPercent = Math.round((currentIndex / totalSteps) * 100);

  function advance(value: string) {
    const updated = { ...formAnswers, [currentKey]: value };
    setFormAnswers(updated);
    setTextInput('');
    setMultiSelected([]);
    setError('');

    if (currentIndex + 1 >= totalSteps) {
      onComplete(updated);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }

  function handleTextSubmit() {
    const val = textInput.trim();
    if (!val || (currentConfig.minLength && val.length < currentConfig.minLength)) {
      setError('Por favor escribí una respuesta más detallada.');
      return;
    }
    advance(val);
  }

  function handleMultiSubmit() {
    if (multiSelected.length === 0) {
      setError('Seleccioná al menos una opción.');
      return;
    }
    const labels = STEP_CONFIGS[currentKey].options!
      .filter(o => multiSelected.includes(o.id))
      .map(o => o.label)
      .join(', ');
    advance(labels);
  }

  function toggleMulti(id: string) {
    setMultiSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto px-4 py-6">

      {/* Stepper */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Paso {currentIndex + 1} de {totalSteps}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Pregunta */}
      <p className="text-base font-medium text-gray-800">
        {currentConfig.question}
      </p>

      {/* Textarea */}
      {currentConfig.type === 'textarea' && (
        <div className="flex flex-col gap-2">
          <textarea
            value={textInput}
            onChange={e => { setTextInput(e.target.value); setError(''); }}
            placeholder={currentConfig.placeholder}
            rows={4}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={handleTextSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* Text */}
      {currentConfig.type === 'text' && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => { setTextInput(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
            placeholder={currentConfig.placeholder}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={handleTextSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* Pills single */}
      {currentConfig.type === 'pills_single' && (
        <div className="flex flex-col gap-2">
          {currentConfig.options!.map(opt => (
            <button key={opt.id} onClick={() => advance(opt.label)}
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm
                text-left hover:bg-blue-50 hover:border-blue-400 transition-colors">
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Pills multi */}
      {currentConfig.type === 'pills_multi' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {currentConfig.options!.map(opt => (
              <button key={opt.id} onClick={() => toggleMulti(opt.id)}
                className={`border rounded-full px-4 py-2 text-sm transition-colors ${
                  multiSelected.includes(opt.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={handleMultiSubmit}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* Province */}
      {currentConfig.type === 'province' && (
        <div className="flex flex-col gap-2">
          <select
            value={textInput}
            onChange={e => { setTextInput(e.target.value); setError(''); }}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="">Seleccioná una provincia...</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={() => {
              if (!textInput) { setError('Seleccioná una provincia.'); return; }
              advance(textInput);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
            Continuar →
          </button>
        </div>
      )}

      {/* Amount */}
      {currentConfig.type === 'amount' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              id="currency-select"
              defaultValue="ARS"
              className="border border-gray-300 rounded-lg px-3 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ARS">ARS $</option>
              <option value="USD">USD $</option>
            </select>
            <input
              type="number"
              value={textInput}
              onChange={e => { setTextInput(e.target.value); setError(''); }}
              placeholder={currentConfig.placeholder}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={() => {
              const currency = (document.getElementById('currency-select') as HTMLSelectElement)?.value ?? 'ARS';
              if (!textInput) { setError('Ingresá un monto aproximado.'); return; }
              advance(`${currency} ${Number(textInput).toLocaleString('es-AR')}`);
            }}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
            Ver análisis →
          </button>
          <button
            onClick={() => advance('No sabe el monto exacto')}
            className="text-gray-500 text-xs underline text-center">
            No sé el monto exacto
          </button>
        </div>
      )}

    </div>
  );
}
```

---

## PASO 6 — Modificar la página principal del chat

Buscar el archivo que renderiza el chat (probablemente `src/app/chat/page.tsx`,
`src/app/page.tsx`, o el componente raíz del chat). Reemplazar la lógica
actual por este flujo de fases:

```tsx
'use client';

import { useState } from 'react';
import { FreeTextStep } from '@/components/chat/FreeTextStep';
import { ExtractedSummary } from '@/components/chat/ExtractedSummary';
import { IntakeForm } from '@/components/chat/IntakeForm';
import type {
  ExtractedAnswers,
  StepKey,
} from '@/lib/chat/intake-extractor';
import { mergeAnswers, buildDiagnosisPrompt } from '@/lib/chat/intake-extractor';

// ---------------------------------------------------------------------------
// Fases del flujo
// ---------------------------------------------------------------------------

type Phase =
  | 'free_text'       // Fase 1: textarea de texto libre
  | 'extracting'      // Fase 2: spinner mientras extrae
  | 'summary'         // Fase 3a: muestra lo detectado
  | 'form'            // Fase 3b: formulario con steps pendientes
  | 'generating'      // Fase 4: spinner mientras genera diagnóstico
  | 'diagnosis';      // Fase 5: diagnóstico en pantalla

export default function ChatPage() {
  const [phase, setPhase] = useState<Phase>('free_text');
  const [extracted, setExtracted] = useState<ExtractedAnswers | null>(null);
  const [pendingSteps, setPendingSteps] = useState<StepKey[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // ── FASE 1 → FASE 2: texto libre enviado ──────────────────────────────
  async function handleFreeTextSubmit(text: string) {
    setIsExtracting(true);

    try {
      const res = await fetch('/api/intake-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Error en la extracción');

      const data = await res.json();
      setExtracted(data.extracted);
      setPendingSteps(data.pendingSteps);
      setIsExtracting(false);

      // Si no hay steps pendientes → ir directo al diagnóstico
      if (data.pendingSteps.length === 0) {
        await generateDiagnosis(data.extracted, {});
      } else {
        setPhase('summary');
      }
    } catch (err) {
      console.error('Error extrayendo datos:', err);
      setIsExtracting(false);
      // En caso de error, mostrar el formulario completo como fallback
      setExtracted({
        step1: null, step2: null, step3: null, step4: null,
        step5: null, step6: null, step7: null, step8: null,
      });
      setPendingSteps(['step1','step2','step3','step4','step5','step6','step7','step8']);
      setPhase('summary');
    }
  }

  // ── FASE 3a → FASE 3b: usuario confirma y va al formulario ───────────
  function handleSummaryContinue() {
    if (pendingSteps.length === 0) {
      // No hay form — generar diagnóstico directamente
      generateDiagnosis(extracted!, {});
    } else {
      setPhase('form');
    }
  }

  // ── FASE 3b → FASE 4: formulario completo ────────────────────────────
  async function handleFormComplete(formAnswers: Partial<ExtractedAnswers>) {
    await generateDiagnosis(extracted!, formAnswers);
  }

  // ── FASE 4 → FASE 5: llamar al LLM de diagnóstico ────────────────────
  async function generateDiagnosis(
    extractedData: ExtractedAnswers,
    formAnswers: Partial<ExtractedAnswers>
  ) {
    setPhase('generating');

    // Merge: datos del formulario tienen prioridad sobre los extraídos
    const finalAnswers = mergeAnswers(extractedData, formAnswers);
    const prompt = buildDiagnosisPrompt(finalAnswers);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              parts: [{ type: 'text', text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Error generando diagnóstico');

      // Leer stream de texto
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
        }
      }

      setDiagnosis(result);
      setPhase('diagnosis');
    } catch (err) {
      console.error('Error generando diagnóstico:', err);
      setPhase('form'); // volver al formulario si falla
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (phase === 'free_text') {
    return (
      <main className="min-h-screen bg-white">
        <FreeTextStep
          onSubmit={handleFreeTextSubmit}
          isLoading={isExtracting}
        />
      </main>
    );
  }

  if (phase === 'extracting' || isExtracting) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Analizando tu relato...</p>
        </div>
      </main>
    );
  }

  if (phase === 'summary' && extracted) {
    return (
      <main className="min-h-screen bg-white">
        <ExtractedSummary
          extracted={extracted}
          pendingSteps={pendingSteps}
          onContinue={handleSummaryContinue}
        />
      </main>
    );
  }

  if (phase === 'form' && pendingSteps.length > 0) {
    return (
      <main className="min-h-screen bg-white">
        <IntakeForm
          pendingSteps={pendingSteps}
          onComplete={handleFormComplete}
        />
      </main>
    );
  }

  if (phase === 'generating') {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Generando tu análisis...</p>
        </div>
      </main>
    );
  }

  if (phase === 'diagnosis') {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/*
            Si el proyecto tiene react-markdown instalado, usar:
            import ReactMarkdown from 'react-markdown';
            <ReactMarkdown>{diagnosis}</ReactMarkdown>

            Si no, usar el pre provisional:
          */}
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
            {diagnosis}
          </pre>
        </div>
      </main>
    );
  }

  return null;
}
```

---

## PASO 7 — Simplificar `src/app/api/chat/route.ts`

El endpoint de chat ahora solo recibe el mensaje de diagnóstico y genera
texto. Sin tools, sin loops, sin extractores.

Localizar la llamada a `streamText` y reemplazar la configuración de tools:

```typescript
// Quitar estos imports si ya no se usan en ningún otro lugar:
// import { proponerOpcionesIntake } from '@/lib/chat/intake-pills-tool';
// import { hasToolCall } from 'ai';

// En streamText, reemplazar:
// tools: { proponerOpcionesIntake, mostrarWhatsappCierre },
// toolChoice: ...,
// stopWhen: [...],

// Por:
tools: {},
toolChoice: 'none' as const,
```

Hacer esto en AMBAS llamadas a streamText (formato nuevo y legacy).

---

## PASO 8 — Reemplazar `src/lib/prompts/consumidor-chat-instructions.md`

```markdown
# ASISTENTE PRE-LEGAL — DEFENSA DEL CONSUMIDOR (AR)

## ROL

Sos un analista virtual especializado en defensa del consumidor argentino
(Ley 24.240 y normas concordantes). Recibís 8 datos estructurados de un
caso ya recolectado y emitís un análisis preliminar completo.

No hacés preguntas — los datos ya están completos.
No sos abogado. No brindás asesoramiento legal formal.
Voseo rioplatense. Tono profesional y directo.
Sin introducción, sin frases de espera. El análisis empieza directo.

---

## DIAGNÓSTICO

Emitís el siguiente bloque en un solo mensaje, en este orden exacto:

## 📋 Análisis Preliminar de tu Caso
*(Este análisis es orientativo y no reemplaza la consulta profesional)*

### 🔍 Resumen de los Hechos
[2-4 oraciones con los hechos provistos. Sin inferencias no declaradas.
Si algún dato figura como "No informado", indicarlo en esta sección.]

### 🗂️ Situación Probatoria
[Evaluá la prueba declarada: qué tiene, qué valor probatorio tiene,
qué le falta, cómo afecta las vías disponibles.]
Calificación: **SÓLIDA / MODERADA / DÉBIL / NO EVALUABLE**

### ⏱️ Situación Respecto del Plazo
Art. 50 LDC: prescripción de 3 años desde el hecho o desde que el
consumidor tomó conocimiento.
- **SIN RIESGO:** menos de 2 años y medio desde el hecho.
- **RIESGO MEDIO:** entre 2 años y medio y 3 años. Verificar con profesional.
- **RIESGO ALTO:** más de 3 años. Puede estar prescripto.
- **NO DETERMINABLE:** no se proveyó fecha.

### ⚖️ Procedimiento Disponible
**a) OMIC / organismo provincial de [PROVINCIA]:** gratuito, sin abogado,
sin indemnización directa.
**b) COPREC:** gratuito, prejudicial obligatorio, acuerdo con fuerza ejecutiva.
**c) Acción judicial:** todos los rubros de daño, requiere abogado.
[Recomendá según monto y provincia del caso.]

### 💼 Daños Reclamables
[Solo los que aplican al caso concreto:]
- **Daño material:** valor del producto o servicio no prestado.
- **Daño moral:** si hubo afectación emocional significativa. Solo si aplica.
- **Daño punitivo (art. 52 bis LDC):** conducta grave o reiterada. Solo si aplica.

### 📲 Próximo Paso Recomendado
Agendá una **consulta inicial gratuita** con uno de los abogados
especializados de nuestra red. Usá el botón de contacto para coordinar.

---

## GUARDRAILS

Nunca:
- Afirmar probabilidad de ganar o estimar montos de indemnización.
- Desaconsejar consultar otro profesional.
- Prometer resultados en nombre del estudio.
- Transcribir artículos literalmente — citar número y parafrasear.
- Orientar sobre legislación fuera de Argentina.

Siempre:
- Si el usuario ya tiene abogado: el análisis es complementario.
- Si menciona urgencia real (daño físico, plazo que vence hoy): indicarlo
  en Observaciones y recomendar contacto inmediato.
```

---

## PASO 9 — Eliminar archivos obsoletos

```bash
rm src/lib/chat/intake-orchestrator.ts
rm src/lib/chat/intake-directive.ts
rm src/lib/chat/intake-validator.ts
rm src/lib/chat/inventory-extractor.ts
```

---

## Verificación final

```bash
npx tsc --noEmit
```

**Test 1 — Usuario que da todo en el texto libre:**
```
Input: "Me cancelaron un vuelo con Latam en abril 2025 en Córdoba.
Reclamé por mail, no responden. Tengo factura. El pasaje fue $1.000.000."
```
Consola esperada:
```
[intake-extract] extracted: {step1: "Cancelación de vuelo", step2: "Latam",
step3: "Abril 2025", step4: "si", step5: "Mail", step6: "No respondieron",
step7: "Córdoba", step8: "ARS 1.000.000"}
[intake-extract] pending: []
```
En pantalla: spinner → resumen de lo detectado → botón "Ver análisis" → diagnóstico. Sin formulario.

**Test 2 — Usuario que da poco:**
```
Input: "Tuve un problema con una empresa"
```
Consola esperada:
```
[intake-extract] pending: ["step1","step2","step3","step4","step7","step8"]
```
En pantalla: resumen (nada detectado) → formulario con 6 steps → diagnóstico.

**Test 3 — Fallo del extractor:**
Si `/api/intake-extract` falla, el flujo cae al formulario completo con
los 8 steps. El usuario puede completar todo manualmente. No hay pantalla
de error.

---

## Resumen de cambios

| Archivo | Acción |
|---|---|
| `src/lib/chat/intake-extractor.ts` | CREAR |
| `src/app/api/intake-extract/route.ts` | CREAR |
| `src/components/chat/FreeTextStep.tsx` | CREAR |
| `src/components/chat/ExtractedSummary.tsx` | CREAR |
| `src/components/chat/IntakeForm.tsx` | CREAR |
| Página principal del chat | MODIFICAR — flujo de fases |
| `src/app/api/chat/route.ts` | SIMPLIFICAR — quitar tools |
| `src/lib/prompts/consumidor-chat-instructions.md` | REEMPLAZAR |
| `src/lib/chat/intake-orchestrator.ts` | ELIMINAR |
| `src/lib/chat/intake-directive.ts` | ELIMINAR |
| `src/lib/chat/intake-validator.ts` | ELIMINAR |
| `src/lib/chat/inventory-extractor.ts` | ELIMINAR |