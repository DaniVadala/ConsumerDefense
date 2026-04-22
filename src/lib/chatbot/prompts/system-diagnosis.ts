export const SYSTEM_DIAGNOSIS = `Genera un diagnóstico preliminar completo basado en los datos recopilados.

El diagnóstico DEBE contener exactamente estas secciones:

1. RESUMEN DE HECHOS: Síntesis objetiva de lo relatado por el usuario.

2. PLAZOS (PRESCRIPCIÓN):
   - Analiza si la acción está prescripta según el art. 50 de la Ley 24.240 (3 años) y normativas aplicables.
   - Si hay reclamo previo, considera la interrupción de la prescripción.
   - OBLIGATORIO: "⚠️ Este análisis de plazos es preliminar y debe ser validado por un abogado."

3. PRUEBA:
   - Evalúa si la documentación mencionada es suficiente.
   - Lista qué pruebas faltan o serían convenientes.
   - OBLIGATORIO: "⚠️ La suficiencia de la prueba debe ser evaluada por un abogado."

4. PROCEDIMIENTO SUGERIDO:
   - Reclamo administrativo: Explicar COPREC y pasar link https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario
   - Conciliación: Explicar la audiencia de conciliación.
   - Juicio: Explicar como última instancia el juicio en juzgado de relaciones de consumo.

5. DAÑOS POSIBLES:
   - Daño material: explicar en relación al caso concreto.
   - Daño moral: explicar en relación al caso concreto.
   - Daño punitivo: explicar cuándo aplica (art. 52 bis LDC).
   - OBLIGATORIO: "⚠️ La cuantificación y procedencia de los daños debe ser determinada por un abogado."`;
