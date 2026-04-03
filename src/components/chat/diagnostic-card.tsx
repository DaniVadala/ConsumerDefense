'use client';

import { Badge, Button, Card, Flex, Text, Box, Heading } from '@radix-ui/themes';
import { Scale, AlertTriangle, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface DiagnosticData {
  diagnostic: true;
  category: string;
  provider: string;
  viability: 'ALTA' | 'MEDIA' | 'BAJA';
  summary: string;
  applicableLaws: string[];
  estimatedDamage: string;
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

function ViabilityBadge({ viability }: { viability: DiagnosticData['viability'] }) {
  if (viability === 'ALTA') {
    return (
      <Badge color="green" size="2">
        <CheckCircle size={11} />
        Viabilidad ALTA
      </Badge>
    );
  }
  if (viability === 'MEDIA') {
    return (
      <Badge color="amber" size="2">
        <AlertTriangle size={11} />
        Viabilidad MEDIA
      </Badge>
    );
  }
  return (
    <Badge color="red" size="2">
      <XCircle size={11} />
      Viabilidad BAJA
    </Badge>
  );
}

export function DiagnosticCard({ data }: { data: DiagnosticData }) {
  const waMessage = encodeURIComponent(
    `Hola! Necesito orientación legal. Mi caso: ${data.summary}. Categoría: ${categoryLabels[data.category] ?? data.category}. Proveedor: ${data.provider}.`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <Card variant="surface" style={{ marginTop: '0.5rem', maxWidth: '100%' }}>
      <Flex gap="2" wrap="wrap" mb="3" align="center">
        <ViabilityBadge viability={data.viability} />
        <Badge variant="outline" color="gray" size="1">
          {categoryLabels[data.category] ?? data.category}
        </Badge>
        <Text size="1" color="gray">{data.provider}</Text>
      </Flex>

      <Box mb="3">
        <Text size="2" weight="bold" mb="1" as="p">Resumen del caso</Text>
        <Text size="2" color="gray">{data.summary}</Text>
      </Box>

      <Box mb="3">
        <Flex align="center" gap="1" mb="1">
          <Scale size={14} style={{ color: 'var(--accent-9)' }} />
          <Text size="2" weight="bold">Leyes aplicables</Text>
        </Flex>
        <Flex direction="column" gap="1">
          {data.applicableLaws.map((law, i) => (
            <Text key={i} size="1" color="gray">• {law}</Text>
          ))}
        </Flex>
      </Box>

      <Box mb="3" p="3" style={{ background: 'var(--accent-2)', borderRadius: 'var(--radius-2)' }}>
        <Text size="1" color="gray" mb="1" as="p">Daño estimado</Text>
        <Heading size="4" color="green">{data.estimatedDamage}</Heading>
      </Box>

      <Box mb="3">
        <Text size="2" weight="bold" mb="2" as="p">Próximos pasos</Text>
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

      <Text size="1" color="gray" style={{ fontStyle: 'italic' }} mb="3" as="p">
        Este diagnóstico es orientativo y no constituye asesoramiento legal profesional.
      </Text>

      <Button asChild color="green" size="3" style={{ width: '100%' }}>
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          Hablar con un abogado gratis
          <ChevronRight size={16} />
        </a>
      </Button>
    </Card>
  );
}
