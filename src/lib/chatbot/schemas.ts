import { z } from 'zod';

// ---------------------------------------------------------------------------
// Conversation step enum
// ---------------------------------------------------------------------------
export const ConversationStepEnum = z.enum([
  'greeting',
  'description',
  'company',
  'date',
  'prior_claim',
  'claim_response',
  'documentation',
  'amount',
  'diagnosis',
  'fallback',
  'completed',
]);
export type ConversationStep = z.infer<typeof ConversationStepEnum>;

// ---------------------------------------------------------------------------
// Fields collected during the conversation
// ---------------------------------------------------------------------------
// LLMs occasionally return booleans as strings ("true", "Sí", etc.)
// This preprocessor coerces them to actual booleans so Redis deserialization never crashes.
const coercibleBoolean = z.preprocess((v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === 'true' || s === 'sí' || s === 'si' || s === 'yes') return true;
    if (s === 'false' || s === 'no') return false;
  }
  return null;
}, z.boolean().nullable().default(null));

export const FieldsCollectedSchema = z.object({
  description: z.string().nullable().default(null),
  company: z.string().nullable().default(null),
  incidentDate: z.string().nullable().default(null),
  incidentDateRange: z.string().nullable().default(null),
  hasPriorClaim: coercibleBoolean,
  priorClaimMedium: z.string().nullable().default(null),
  priorClaimDate: z.string().nullable().default(null),
  claimResponse: z.string().nullable().default(null),
  claimResponseTime: z.string().nullable().default(null),
  hasDocumentation: coercibleBoolean,
  documentationDetails: z.string().nullable().default(null),
  amount: z.string().nullable().default(null),
  additionalExpenses: z.string().nullable().default(null),
});
export type FieldsCollected = z.infer<typeof FieldsCollectedSchema>;

// ---------------------------------------------------------------------------
// Conversation state stored in Redis
// ---------------------------------------------------------------------------
export const ConversationStateSchema = z.object({
  sessionId: z.string().uuid(),
  currentStep: ConversationStepEnum,
  fieldsCollected: FieldsCollectedSchema,
  nonConducentCount: z.number().int().min(0).max(10).default(0),
  stuckCount: z.number().int().min(0).max(10).default(0),
  conversationSummary: z.string().default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  turnCount: z.number().int().min(0).default(0),
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

// ---------------------------------------------------------------------------
// Response classification
// ---------------------------------------------------------------------------
export const ResponseClassificationTypeEnum = z.enum([
  'conducente',
  'no_conducente',
  'insulto',
  'emergencia',
  'fuera_de_scope',
  'prompt_injection',
  'fraude_etico',
  'multi_field',
]);
export type ResponseClassificationType = z.infer<typeof ResponseClassificationTypeEnum>;

export const ResponseClassificationSchema = z.object({
  type: ResponseClassificationTypeEnum,
  fieldsAnswered: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type ResponseClassification = z.infer<typeof ResponseClassificationSchema>;

// ---------------------------------------------------------------------------
// Extracted fields (partial FieldsCollected)
// ---------------------------------------------------------------------------
export const ExtractedFieldsSchema = FieldsCollectedSchema.partial();
export type ExtractedFields = z.infer<typeof ExtractedFieldsSchema>;

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------
export const DiagnosisSchema = z.object({
  factSummary: z.string(),
  prescriptionAnalysis: z.object({
    isPrescribed: z.boolean(),
    details: z.string(),
    disclaimer: z.string(),
  }),
  evidenceAnalysis: z.object({
    isComplete: z.boolean(),
    missingItems: z.array(z.string()),
    details: z.string(),
    disclaimer: z.string(),
  }),
  procedureSteps: z.object({
    administrativeClaim: z.object({
      description: z.string(),
      onlineLink: z.string(),
    }),
    conciliation: z.object({ description: z.string() }),
    lawsuit: z.object({ description: z.string() }),
  }),
  damagesAnalysis: z.object({
    moral: z.string(),
    material: z.string(),
    punitive: z.string(),
    disclaimer: z.string(),
  }),
});
export type Diagnosis = z.infer<typeof DiagnosisSchema>;

// ---------------------------------------------------------------------------
// Escalation result
// ---------------------------------------------------------------------------
export const EscalationReasonEnum = z.enum([
  'insulto',
  'no_conducente_reiterado',
  'fuera_de_scope',
  'emergencia',
  'prompt_injection',
  'fraude_etico',
]);
export type EscalationReason = z.infer<typeof EscalationReasonEnum>;

export const EscalationResultSchema = z.object({
  shouldEscalate: z.literal(true),
  fallbackMessage: z.string(),
  showWhatsAppButton: z.boolean(),
});
export type EscalationResult = z.infer<typeof EscalationResultSchema>;

// ---------------------------------------------------------------------------
// API request body validation
// ---------------------------------------------------------------------------
export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(6000),
  /** Optional secret token to bypass IP rate limiting (admin access). */
  bypassToken: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
