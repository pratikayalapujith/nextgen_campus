import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '|||' },
    { to: '/students', label: 'Students', icon: 'S' },
    { to: '/faculty', label: 'Faculty', icon: 'F' },
    { to: '/departments', label: 'Departments', icon: 'D' },
    { to: '/subjects', label: 'Subjects', icon: 'B' },
    { to: '/timetable', label: 'Timetable', icon: 'T' },
    { to: '/attendance', label: 'Attendance', icon: 'A' },
    { to: '/notices', label: 'Notices', icon: 'N' },
    { to: '/facilities', label: 'Facilities', icon: 'C' },
    { to: '/bookings', label: 'Bookings', icon: 'R' },
  ],
  faculty: [
    { to: '/dashboard', label: 'Dashboard', icon: '|||' },
    { to: '/timetable', label: 'My Timetable', icon: 'T' },
    { to: '/attendance', label: 'Attendance', icon: 'A' },
    { to: '/notices', label: 'Notices', icon: 'N' },
    { to: '/bookings', label: 'Bookings', icon: 'R' },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: '|||' },
    { to: '/timetable', label: 'My Timetable', icon: 'T' },
    { to: '/attendance', label: 'My Attendance', icon: 'A' },
    { to: '/notices', label: 'Notices', icon: 'N' },
    { to: '/bookings', label: 'Bookings', icon: 'R' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="border-b border-gray-700 p-4">
        <h1 className="text-xl font-bold text-blue-400">NextGen Campus</h1>
        <p className="mt-1 text-xs text-gray-400">Management System</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-700 text-xs font-bold">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
