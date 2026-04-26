/**
 * 23 provincias + CABA — nombres para autocompletado y mensaje al validador.
 */
export const AR_JURISDICTIONS: readonly { id: string; name: string }[] = [
  { id: 'CABA', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'BA', name: 'Buenos Aires' },
  { id: 'CA', name: 'Catamarca' },
  { id: 'CHACO', name: 'Chaco' },
  { id: 'CHUBUT', name: 'Chubut' },
  { id: 'CORDOBA', name: 'Córdoba' },
  { id: 'CORR', name: 'Corrientes' },
  { id: 'ER', name: 'Entre Ríos' },
  { id: 'FO', name: 'Formosa' },
  { id: 'JUJUY', name: 'Jujuy' },
  { id: 'LP', name: 'La Pampa' },
  { id: 'LR', name: 'La Rioja' },
  { id: 'MZ', name: 'Mendoza' },
  { id: 'MIS', name: 'Misiones' },
  { id: 'NQN', name: 'Neuquén' },
  { id: 'RN', name: 'Río Negro' },
  { id: 'SA', name: 'Salta' },
  { id: 'SJ', name: 'San Juan' },
  { id: 'SL', name: 'San Luis' },
  { id: 'SCZ', name: 'Santa Cruz' },
  { id: 'SF', name: 'Santa Fe' },
  { id: 'SE', name: 'Santiago del Estero' },
  { id: 'TF', name: 'Tierra del Fuego' },
  { id: 'TUC', name: 'Tucumán' },
] as const;
