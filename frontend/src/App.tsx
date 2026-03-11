import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import DepartmentsPage from './pages/DepartmentsPage';
import SubjectsPage from './pages/SubjectsPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import NoticesPage from './pages/NoticesPage';
import FacilitiesPage from './pages/FacilitiesPage';
import BookingsPage from './pages/BookingsPage';
import NotFoundPage from './pages/NotFoundPage';

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<ProtectedRoute roles={['admin', 'faculty']}><StudentsPage /></ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute roles={['admin']}><FacultyPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute roles={['admin']}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute roles={['admin']}><SubjectsPage /></ProtectedRoute>} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/facilities" element={<ProtectedRoute roles={['admin']}><FacilitiesPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<BookingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
