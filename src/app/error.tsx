// DATA-RELIABILITY: Global error boundary — shows fallback UI for unexpected runtime errors
'use client';

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => unstable_retry()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Intentar de nuevo
        </button>
        <a
          href="/"
          className="border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
