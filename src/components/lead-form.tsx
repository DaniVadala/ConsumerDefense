'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, X } from 'lucide-react';

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => setSubmitted(false), 300);
  }, [onOpenChange]);

  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) handleClose();
  }, [handleClose]);

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

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleDialogClick}
      className="backdrop:bg-black/50 rounded-xl p-0 max-w-[480px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto shadow-xl border-0 bg-white"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Dejá tus datos</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Un especialista te contacta en menos de 24hs. Sin compromiso.
        </p>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-50">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">¡Listo!</p>
            <p className="text-sm text-gray-500 text-center">
              Recibimos tus datos. Te contactamos en menos de 24hs.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-5 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="nombre" className="text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Tu nombre"
                  className={`mt-1 w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${errors.nombre ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200'}`}
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label htmlFor="telefono" className="text-sm font-medium text-gray-700">WhatsApp o teléfono *</label>
                <input
                  id="telefono"
                  {...register('telefono')}
                  placeholder="+54 351 000 0000"
                  type="tel"
                  className={`mt-1 w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${errors.telefono ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200'}`}
                />
                {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email (opcional)</label>
                <input
                  id="email"
                  {...register('email')}
                  placeholder="tu@email.com"
                  type="email"
                  className={`mt-1 w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200'}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="problema" className="text-sm font-medium text-gray-700">¿Cuál es tu problema? *</label>
                <textarea
                  id="problema"
                  {...register('problema')}
                  placeholder="Describí brevemente qué pasó..."
                  rows={4}
                  className={`mt-1 w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors resize-y ${errors.problema ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200'}`}
                />
                {errors.problema && <p className="text-xs text-red-500 mt-1">{errors.problema.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar mis datos →'}
              </button>

              {submitError && (
                <p className="text-xs text-red-500 text-center">
                  Hubo un error al enviar. Intentá de nuevo.
                </p>
              )}

              <p className="text-xs text-gray-400 text-center">
                Tus datos son confidenciales y no se comparten con terceros.
              </p>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
