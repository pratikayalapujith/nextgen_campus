import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-8xl font-bold text-gray-200">404</h1>
        <p className="mt-4 text-xl font-semibold text-gray-700">Page not found</p>
        <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
