export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty' | 'student';
  phone?: string;
  is_active: boolean;
  created_at?: string;
  student_profile?: StudentProfile;
  faculty_profile?: FacultyProfile;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  roll_number: string;
  department_id: number;
  department_name?: string;
  semester: number;
  section?: string;
  admission_year: number;
  date_of_birth?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

export interface FacultyProfile {
  id: number;
  user_id: number;
  employee_id: string;
  department_id: number;
  department_name?: string;
  designation?: string;
  qualification?: string;
  date_of_joining?: string;
  specialization?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  student_count?: number;
  faculty_count?: number;
  created_at?: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  department_id: number;
  department_name?: string;
  semester: number;
  credits: number;
  faculty_id?: number;
  faculty_name?: string;
}

export interface TimetableEntry {
  id: number;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  faculty_id: number;
  faculty_name?: string;
  department_id: number;
  semester: number;
  section?: string;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name?: string;
  roll_number?: string;
  timetable_entry_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  marked_by: number;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  target_role: string;
  department_id?: number;
  department_name?: string;
  author_id: number;
  author_name?: string;
  is_pinned: boolean;
  published_at?: string;
  expires_at?: string;
}

export interface Facility {
  id: number;
  name: string;
  type: string;
  capacity?: number;
  location?: string;
  description?: string;
  is_available: boolean;
}

export interface FacilityBooking {
  id: number;
  facility_id: number;
  facility_name?: string;
  booked_by: number;
  booker_name?: string;
  purpose: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface StudentForClass {
  id: number;
  roll_number: string;
  full_name: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface DashboardStats {
  total_students: number;
  total_faculty: number;
  total_departments: number;
  pending_bookings: number;
  active_notices: number;
}
