from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, date
from app.extensions import db
from app.models.attendance import AttendanceRecord
from app.models.timetable import TimetableEntry
from app.models.student import Student
from app.models.faculty import Faculty
from app.utils.decorators import role_required

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')


@attendance_bp.route('/mark', methods=['POST'])
@role_required('faculty')
def mark_attendance():
    data = request.get_json()
    timetable_entry_id = data.get('timetable_entry_id')
    att_date = data.get('date')
    records = data.get('records', [])

    if not timetable_entry_id or not att_date or not records:
        return jsonify(error='timetable_entry_id, date, and records are required'), 400

    entry = TimetableEntry.query.get(timetable_entry_id)
    if not entry:
        return jsonify(error='Timetable entry not found'), 404

    # Verify faculty owns this entry
    identity = int(get_jwt_identity())
    fac = Faculty.query.filter_by(user_id=identity).first()
    if not fac or entry.faculty_id != fac.id:
        return jsonify(error='You can only mark attendance for your own classes'), 403

    att_date_obj = date.fromisoformat(att_date)

    # Check if attendance already marked
    existing = AttendanceRecord.query.filter_by(
        timetable_entry_id=timetable_entry_id,
        date=att_date_obj,
    ).first()
    if existing:
        return jsonify(error='Attendance already marked for this class on this date'), 409

    for record in records:
        att = AttendanceRecord(
            student_id=record['student_id'],
            timetable_entry_id=timetable_entry_id,
            date=att_date_obj,
            status=record['status'],
            marked_by=identity,
        )
        db.session.add(att)

    db.session.commit()
    return jsonify(message=f'Attendance marked for {len(records)} students'), 201


@attendance_bp.route('/by-class', methods=['GET'])
@role_required('admin', 'faculty')
def get_by_class():
    timetable_entry_id = request.args.get('timetable_entry_id', type=int)
    att_date = request.args.get('date')

    if not timetable_entry_id or not att_date:
        return jsonify(error='timetable_entry_id and date are required'), 400

    records = AttendanceRecord.query.filter_by(
        timetable_entry_id=timetable_entry_id,
        date=date.fromisoformat(att_date),
    ).all()

    return jsonify(records=[r.to_dict() for r in records])


@attendance_bp.route('/by-student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_by_student(student_id):
    claims = get_jwt()
    if claims['role'] == 'student':
        current_user_id = int(get_jwt_identity())
        student = Student.query.get_or_404(student_id)
        if student.user_id != current_user_id:
            return jsonify(error='Access denied'), 403

    subject_id = request.args.get('subject_id', type=int)

    query = AttendanceRecord.query.filter_by(student_id=student_id)

    if subject_id:
        query = query.join(TimetableEntry).filter(TimetableEntry.subject_id == subject_id)

    records = query.order_by(AttendanceRecord.date.desc()).all()

    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))
    percentage = round((present / total) * 100, 1) if total > 0 else 0

    return jsonify(
        records=[r.to_dict() for r in records],
        summary={
            'total': total,
            'present': present,
            'absent': total - present,
            'percentage': percentage,
        }
    )


@attendance_bp.route('/report', methods=['GET'])
@role_required('admin', 'faculty')
def attendance_report():
    department_id = request.args.get('department_id', type=int)
    semester = request.args.get('semester', type=int)
    subject_id = request.args.get('subject_id', type=int)

    query = AttendanceRecord.query.join(TimetableEntry)

    if department_id:
        query = query.filter(TimetableEntry.department_id == department_id)
    if semester:
        query = query.filter(TimetableEntry.semester == semester)
    if subject_id:
        query = query.filter(TimetableEntry.subject_id == subject_id)

    records = query.all()

    # Group by student
    student_stats = {}
    for r in records:
        sid = r.student_id
        if sid not in student_stats:
            student_stats[sid] = {
                'student_id': sid,
                'student_name': r.student.user.full_name if r.student and r.student.user else None,
                'roll_number': r.student.roll_number if r.student else None,
                'total': 0,
                'present': 0,
            }
        student_stats[sid]['total'] += 1
        if r.status in ('present', 'late'):
            student_stats[sid]['present'] += 1

    report = []
    for stats in student_stats.values():
        stats['percentage'] = round((stats['present'] / stats['total']) * 100, 1) if stats['total'] > 0 else 0
        report.append(stats)

    report.sort(key=lambda x: x['roll_number'] or '')
    return jsonify(report=report)


@attendance_bp.route('/students-for-class', methods=['GET'])
@role_required('faculty')
def students_for_class():
    timetable_entry_id = request.args.get('timetable_entry_id', type=int)
    if not timetable_entry_id:
        return jsonify(error='timetable_entry_id is required'), 400

    entry = TimetableEntry.query.get_or_404(timetable_entry_id)

    query = Student.query.filter_by(
        department_id=entry.department_id,
        semester=entry.semester,
    )
    if entry.section:
        query = query.filter_by(section=entry.section)

    students = query.join(Student.user).order_by(Student.roll_number).all()

    return jsonify(students=[{
        'id': s.id,
        'roll_number': s.roll_number,
        'full_name': s.user.full_name,
    } for s in students])
