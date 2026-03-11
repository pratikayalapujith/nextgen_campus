import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-800">
        Welcome, {user?.full_name}
      </h2>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 capitalize">
          {user?.role}
        </span>
      </div>
    </header>
  );
}
