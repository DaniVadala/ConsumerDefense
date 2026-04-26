'use client';

import { useState } from 'react';
import { Shield, CheckCircle, Users, Briefcase, Send } from 'lucide-react';

const SPECIALTIES = [
  'Defensa del Consumidor',
  'Derecho Bancario y Financiero',
  'Telecomunicaciones',
  'Seguros',
  'Responsabilidad Civil',
  'Derecho Aeronáutico',
  'Contrato de Consumo',
  'Daños y Perjuicios',
  'Derecho Laboral',
  'Otra especialidad',
];

const JURISDICTIONS = [
  'CABA', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán',
  'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Corrientes', 'Santiago del Estero',
  'San Juan', 'Jujuy', 'Río Negro', 'Neuquén', 'Formosa', 'Chubut',
  'San Luis', 'Catamarca', 'La Rioja', 'La Pampa', 'Santa Cruz', 'Tierra del Fuego',
  'Nacional (todo el país)',
];

export default function AbogadosPage() {
  const [form, setForm] = useState({
    name: '',
    registration: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    jurisdiction: '',
    yearsOfPractice: '',
    cvUrl: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const toggleSpecialty = (s: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.specialties.length === 0) {
      setError('Seleccioná al menos una especialidad.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/lawyers-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearsOfPractice: form.yearsOfPractice ? Number(form.yearsOfPractice) : undefined,
        }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setError('Error al enviar el formulario. Intentá de nuevo.');
      }
    } catch {
      setStatus('error');
      setError('Error de conexión. Intentá de nuevo.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 font-bold text-gray-900 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg">DefensaYa</span>
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Users className="w-4 h-4" />
            Red profesional · Fase beta
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Sos abogado/a?<br />
            <span className="text-emerald-600">Unite a nuestra red profesional</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Recibí derivaciones cualificadas de usuarios que ya completaron su diagnóstico preliminar
            automatizado. Casos pre-analizados, listos para asesoramiento profesional.
          </p>
        </div>

        {/* Value props */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
              title: 'Derivaciones cualificadas',
              desc: 'Los usuarios llegan con un análisis preliminar completo de su caso, lo que reduce el tiempo de intake inicial.',
            },
            {
              icon: <Briefcase className="w-6 h-6 text-emerald-600" />,
              title: 'Modelo beta gratuito',
              desc: 'Durante la fase beta, la red es de voluntarios. En el futuro pasará a ser un modelo de suscripción profesional.',
            },
            {
              icon: <Shield className="w-6 h-6 text-emerald-600" />,
              title: 'Actuación independiente',
              desc: 'Cada abogado actúa por cuenta propia y define sus honorarios. DefensaYa solo facilita el contacto inicial.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            <h2 className="text-xl font-bold text-white">Formulario de inscripción</h2>
            <p className="text-white/70 text-sm mt-1">Completá tus datos para unirte a la red.</p>
          </div>

          {status === 'success' ? (
            <div className="px-8 py-14 text-center">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Inscripción recibida!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Nos pondremos en contacto cuando la red esté operativa en tu jurisdicción. Gracias por sumarte.
              </p>
              <a href="/" className="mt-6 inline-block text-emerald-600 font-semibold hover:underline">
                Volver al inicio
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
              {/* Name + Registration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="Ej: María García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula (tomo, folio, colegio) *</label>
                  <input
                    required
                    type="text"
                    value={form.registration}
                    onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="Ej: Tomo 25, Folio 342, CPACF"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email profesional *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Áreas de especialidad * (seleccioná todas las que correspondan)</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        form.specialties.includes(s)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jurisdiction + Years */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdicción principal *</label>
                  <select
                    required
                    value={form.jurisdiction}
                    onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                  >
                    <option value="">Seleccioná una provincia...</option>
                    {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Años de ejercicio (opcional)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.yearsOfPractice}
                    onChange={(e) => setForm((f) => ({ ...f, yearsOfPractice: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                    placeholder="Ej: 5"
                  />
                </div>
              </div>

              {/* CV URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de LinkedIn o CV online (opcional)</label>
                <input
                  type="url"
                  value={form.cvUrl}
                  onChange={(e) => setForm((f) => ({ ...f, cvUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
              >
                {status === 'sending' ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar inscripción
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Tus datos se usan exclusivamente para gestionar tu inscripción en la red. No se comparten con terceros.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
