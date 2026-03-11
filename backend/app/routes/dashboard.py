from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, date
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.department import Department
from app.models.notice import Notice
from app.models.facility import FacilityBooking
from app.models.attendance import AttendanceRecord
from app.models.timetable import TimetableEntry
from app.utils.decorators import role_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/stats', methods=['GET'])
@role_required('admin')
def admin_stats():
    return jsonify(
        total_students=Student.query.count(),
        total_faculty=Faculty.query.count(),
        total_departments=Department.query.count(),
        pending_bookings=FacilityBooking.query.filter_by(status='pending').count(),
        active_notices=Notice.query.count(),
    )


@dashboard_bp.route('/recent-notices', methods=['GET'])
@jwt_required()
def recent_notices():
    claims = get_jwt()
    from app.extensions import db
    query = Notice.query.filter(
        db.or_(Notice.target_role == 'all', Notice.target_role == claims.get('role'))
    ).order_by(Notice.is_pinned.desc(), Notice.published_at.desc()).limit(5)

    return jsonify(notices=[n.to_dict() for n in query.all()])


@dashboard_bp.route('/student-stats', methods=['GET'])
@role_required('student')
def student_stats():
    identity = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=identity).first()
    if not student:
        return jsonify(error='Student profile not found'), 404

    records = AttendanceRecord.query.filter_by(student_id=student.id).all()
    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))
    percentage = round((present / total) * 100, 1) if total > 0 else 0

    today_day = date.today().weekday()  # 0=Monday
    today_classes = TimetableEntry.query.filter_by(
        department_id=student.department_id,
        semester=student.semester,
        day_of_week=today_day,
    )
    if student.section:
        today_classes = today_classes.filter_by(section=student.section)
    today_classes = today_classes.order_by(TimetableEntry.start_time).all()

    return jsonify(
        attendance_percentage=percentage,
        total_classes=total,
        present_count=present,
        today_classes=[c.to_dict() for c in today_classes],
    )


@dashboard_bp.route('/faculty-stats', methods=['GET'])
@role_required('faculty')
def faculty_stats():
    identity = int(get_jwt_identity())
    fac = Faculty.query.filter_by(user_id=identity).first()
    if not fac:
        return jsonify(error='Faculty profile not found'), 404

    today_day = date.today().weekday()
    today_classes = TimetableEntry.query.filter_by(
        faculty_id=fac.id,
        day_of_week=today_day,
    ).order_by(TimetableEntry.start_time).all()

    total_subjects = fac.subjects.count()

    return jsonify(
        today_classes=[c.to_dict() for c in today_classes],
        total_subjects=total_subjects,
        total_classes=fac.timetable_entries.count(),
    )


@dashboard_bp.route('/attendance-summary', methods=['GET'])
@role_required('admin', 'faculty')
def attendance_summary():
    departments = Department.query.all()
    summary = []
    for dept in departments:
        students = Student.query.filter_by(department_id=dept.id).all()
        total_records = 0
        present_records = 0
        for s in students:
            records = AttendanceRecord.query.filter_by(student_id=s.id).all()
            total_records += len(records)
            present_records += sum(1 for r in records if r.status in ('present', 'late'))

        percentage = round((present_records / total_records) * 100, 1) if total_records > 0 else 0
        summary.append({
            'department': dept.name,
            'department_code': dept.code,
            'total_students': len(students),
            'attendance_percentage': percentage,
        })

    return jsonify(summary=summary)
