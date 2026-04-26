/**
 * Mensaje unificado cuando el relato, la salida o el material no resultan
 * conducentes o pasan el filtro de uso (moderación + aptitud al canal).
 */
export const INTAKE_OR_OUTPUT_POLICY_MESSAGE =
  'En este canal no podemos continuar: la información aportada no resulta conducente, es insuficiente, o contiene lenguaje inapropiado. Por la falta de datos relevantes o por el contexto, te invitamos a contactarnos por los demás canales disponibles (por ejemplo WhatsApp) para ser atendido por el equipo.';

/** Respuesta única del modelo cuando el caso está fuera de defensa del consumidor; el cliente la reemplaza por INTAKE_OR_OUTPUT_POLICY_MESSAGE. */
export const DIAGNOSIS_OUT_OF_SCOPE_SENTINEL = '__POLICY_REDIRECT__';
