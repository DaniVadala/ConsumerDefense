'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { CheckCircle } from 'lucide-react';

const leadSchema = z.object({
  nombre: z.string().min(2, 'Ingresá tu nombre'),
  telefono: z.string().min(8, 'Ingresá un número válido (mínimo 8 dígitos)'),
  email: z.union([z.email('Email inválido'), z.literal('')]).optional(),
  problema: z.string().min(20, 'Contanos un poco más (mínimo 20 caracteres)'),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadForm({ open, onOpenChange }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setSubmitError(false);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
        reset();
      } else {
        setSubmitError(true);
      }
    } catch {
      setSubmitError(true);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => setSubmitted(false), 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="480px" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <Dialog.Title>Dejá tus datos</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Un especialista te contacta en menos de 24hs. Sin compromiso.
        </Dialog.Description>

        {submitted ? (
          <Flex direction="column" align="center" justify="center" py="8" gap="4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-3)' }}>
              <CheckCircle className="w-8 h-8" style={{ color: 'var(--accent-9)' }} />
            </div>
            <Text size="4" weight="bold">¡Listo!</Text>
            <Text size="2" color="gray" align="center">
              Recibimos tus datos. Te contactamos en menos de 24hs.
            </Text>
            <Dialog.Close>
              <Button variant="soft" color="green" mt="2">Cerrar</Button>
            </Dialog.Close>
          </Flex>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="3">
              <div>
                <Text as="label" size="2" weight="medium" htmlFor="nombre">Nombre *</Text>
                <TextField.Root
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Tu nombre"
                  size="3"
                  color={errors.nombre ? 'red' : undefined}
                  mt="1"
                />
                {errors.nombre && <Text size="1" color="red" mt="1" as="p">{errors.nombre.message}</Text>}
              </div>

              <div>
                <Text as="label" size="2" weight="medium" htmlFor="telefono">WhatsApp o teléfono *</Text>
                <TextField.Root
                  id="telefono"
                  {...register('telefono')}
                  placeholder="+54 351 000 0000"
                  type="tel"
                  size="3"
                  color={errors.telefono ? 'red' : undefined}
                  mt="1"
                />
                {errors.telefono && <Text size="1" color="red" mt="1" as="p">{errors.telefono.message}</Text>}
              </div>

              <div>
                <Text as="label" size="2" weight="medium" htmlFor="email">Email (opcional)</Text>
                <TextField.Root
                  id="email"
                  {...register('email')}
                  placeholder="tu@email.com"
                  type="email"
                  size="3"
                  color={errors.email ? 'red' : undefined}
                  mt="1"
                />
                {errors.email && <Text size="1" color="red" mt="1" as="p">{errors.email.message}</Text>}
              </div>

              <div>
                <Text as="label" size="2" weight="medium" htmlFor="problema">¿Cuál es tu problema? *</Text>
                <TextArea
                  id="problema"
                  {...register('problema')}
                  placeholder="Describí brevemente qué pasó..."
                  rows={4}
                  size="3"
                  color={errors.problema ? 'red' : undefined}
                  mt="1"
                />
                {errors.problema && <Text size="1" color="red" mt="1" as="p">{errors.problema.message}</Text>}
              </div>

              <Button type="submit" disabled={isSubmitting} color="green" size="3" mt="2">
                {isSubmitting ? 'Enviando...' : 'Enviar mis datos →'}
              </Button>

              {submitError && (
                <Text size="1" color="red" align="center">
                  Hubo un error al enviar. Intentá de nuevo.
                </Text>
              )}

              <Text size="1" color="gray" align="center">
                Tus datos son confidenciales y no se comparten con terceros.
              </Text>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
