'use client';

import { Badge, Card, Flex, Text, Box } from '@radix-ui/themes';
import { Scale, AlertTriangle, CheckCircle, HelpCircle, ChevronRight, Info } from 'lucide-react';

interface DiagnosticData {
  diagnostic: true;
  category: string;
  provider: string;
  relevance: 'RELEVANTE' | 'REQUIERE ANÁLISIS' | 'FUERA DE ALCANCE';
  summary: string;
  applicableLaws: string[];
  legalContext: string;
  nextSteps: string[];
}

const WHATSAPP_NUMBER = '5493512852894';

const categoryLabels: Record<string, string> = {
  BANKING: 'Bancario',
  TELECOM: 'Telecomunicaciones',
  INSURANCE: 'Seguros',
  ECOMMERCE: 'E-commerce',
  APPLIANCES: 'Electrodomésticos',
  REAL_ESTATE: 'Inmobiliario',
  AUTOMOTIVE: 'Automotriz',
  OTHER: 'Otro',
};

function RelevanceBadge({ relevance }: { relevance: DiagnosticData['relevance'] }) {
  if (relevance === 'RELEVANTE') {
    return (
      <Badge color="teal" size="2">
        <CheckCircle size={11} />
        Caso relevante
      </Badge>
    );
  }
  if (relevance === 'REQUIERE ANÁLISIS') {
    return (
      <Badge color="amber" size="2">
        <AlertTriangle size={11} />
        Requiere análisis profesional
      </Badge>
    );
  }
  return (
    <Badge color="gray" size="2">
      <HelpCircle size={11} />
      Fuera del alcance de consumo
    </Badge>
  );
}

export function DiagnosticCard({ data }: { data: DiagnosticData }) {
  const waMessage = encodeURIComponent(
    `Hola! Quisiera que un abogado evalúe mi caso. Situación: ${data.summary}. Categoría: ${categoryLabels[data.category] ?? data.category}. Proveedor: ${data.provider}.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <Card variant="surface" style={{ marginTop: '0.5rem', maxWidth: '100%' }}>
      {/* Header badges */}
      <Flex gap="2" wrap="wrap" mb="3" align="center">
        <RelevanceBadge relevance={data.relevance} />
        <Badge variant="outline" color="gray" size="1">
          {categoryLabels[data.category] ?? data.category}
        </Badge>
        <Text size="1" color="gray">{data.provider}</Text>
      </Flex>

      {/* Summary */}
      <Box mb="3">
        <Text size="2" weight="bold" mb="1" as="p">Situación informada</Text>
        <Text size="2" color="gray">{data.summary}</Text>
      </Box>

      {/* Applicable laws */}
      <Box mb="3">
        <Flex align="center" gap="1" mb="1">
          <Scale size={14} style={{ color: 'var(--accent-9)' }} />
          <Text size="2" weight="bold">Normativa que podría aplicar</Text>
        </Flex>
        <Flex direction="column" gap="1">
          {data.applicableLaws.map((law, i) => (
            <Text key={i} size="1" color="gray">• {law}</Text>
          ))}
        </Flex>
      </Box>

      {/* Legal context — replaces estimated damage */}
      <Box mb="3" p="3" style={{ background: 'var(--accent-2)', borderRadius: 'var(--radius-2)' }}>
        <Flex align="center" gap="1" mb="1">
          <Info size={13} style={{ color: 'var(--accent-9)' }} />
          <Text size="1" weight="bold" color="green">Marco legal aplicable</Text>
        </Flex>
        <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>{data.legalContext}</Text>
      </Box>

      {/* Next steps */}
      <Box mb="3">
        <Text size="2" weight="bold" mb="2" as="p">Pasos sugeridos</Text>
        <Flex direction="column" gap="2">
          {data.nextSteps.map((step, i) => (
            <Flex key={i} gap="2" align="start">
              <span style={{
                background: 'var(--accent-9)',
                color: 'white',
                borderRadius: '9999px',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '10px',
                fontWeight: 'bold',
                marginTop: '2px',
              }}>
                {i + 1}
              </span>
              <Text size="1" color="gray">{step}</Text>
            </Flex>
          ))}
        </Flex>
      </Box>

      {/* Disclaimer — prominent */}
      <Box mb="3" p="2" style={{ background: 'var(--amber-2)', border: '1px solid var(--amber-5)', borderRadius: 'var(--radius-2)' }}>
        <Text size="1" style={{ color: 'var(--amber-11)', lineHeight: 1.45 }}>
          <strong>⚠️ Aviso importante:</strong> Esta orientación es de carácter general e informativo, basada en la legislación pública argentina. No constituye asesoramiento legal profesional, no reemplaza la consulta con un abogado matriculado y no garantiza un resultado determinado. Cada caso requiere evaluación individual por un profesional habilitado.
        </Text>
      </Box>

      {/* CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--green-9)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.9375rem',
          borderRadius: 'var(--radius-3)',
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--green-10)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--green-9)')}
      >
        Consultar con un abogado (sin cargo inicial)
        <ChevronRight size={16} />
      </a>
    </Card>
  );
}
