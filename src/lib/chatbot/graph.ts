/**
 * Grafo principal del chatbot DefensaYa.
 *
 * Principio de routing: cada invocación del grafo = un turno de conversación.
 * Un nodo produce output para el usuario → END.
 * La única excepción son los nodos de computación pura (diagnostico, urgencia)
 * que nunca requieren input del usuario y se encadenan desde intake/saludo.
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { GraphState, type GraphStateType } from './state';
import {
  saludoNode,
  clasificacionNode,
  intakeNode,
  diagnosticoNode,
  urgenciaNode,
} from './nodes';

// ============================================================
// ROUTER UNIVERSAL: solo continúa hacia nodos de computación pura
// ============================================================

/**
 * Después de cualquier nodo conversacional (saludo, clasificacion, intake),
 * solo se continúa si el destino es diagnostico o urgencia.
 * En cualquier otro caso, END — el usuario tiene que enviar otro mensaje.
 */
function shouldContinue(state: GraphStateType): string {
  const dest = state.currentNode;
  if (dest === 'diagnostico') return 'diagnostico';
  if (dest === 'urgencia') return 'urgencia';
  return END;
}

// ============================================================
// ENTRY ROUTER: primer nodo según el state de sesión
// ============================================================

function entryRouter(state: GraphStateType): string {
  const node = state.currentNode;
  if (!node || node === 'saludo' || node === 'cierre' || node === 'fallback') {
    return 'saludo';
  }
  if (node === 'clasificacion') return 'clasificacion';
  if (node === 'intake') return 'intake';
  if (node === 'diagnostico') return 'diagnostico';
  if (node === 'urgencia') return 'urgencia';
  return 'saludo';
}

// ============================================================
// CONSTRUIR EL GRAFO
// ============================================================

export function buildChatGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('saludo', saludoNode)
    .addNode('clasificacion', clasificacionNode)
    .addNode('intake', intakeNode)
    .addNode('diagnostico', diagnosticoNode)
    .addNode('urgencia', urgenciaNode)

    // Entry point condicional
    .addConditionalEdges(START, entryRouter, {
      saludo: 'saludo',
      clasificacion: 'clasificacion',
      intake: 'intake',
      diagnostico: 'diagnostico',
      urgencia: 'urgencia',
    })

    // Todos los nodos conversacionales usan el mismo router
    .addConditionalEdges('saludo', shouldContinue, {
      diagnostico: 'diagnostico',
      urgencia: 'urgencia',
      [END]: END,
    })
    .addConditionalEdges('clasificacion', shouldContinue, {
      diagnostico: 'diagnostico',
      urgencia: 'urgencia',
      [END]: END,
    })
    .addConditionalEdges('intake', shouldContinue, {
      diagnostico: 'diagnostico',
      [END]: END,
    })

    // Nodos de computación pura → siempre END
    .addEdge('diagnostico', END)
    .addEdge('urgencia', END);

  return graph.compile();
}
