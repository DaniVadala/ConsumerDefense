// DATA-RELIABILITY: Custom 404 page with helpful navigation
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-gray-200 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Página no encontrada</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
