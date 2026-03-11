from app.extensions import db
from datetime import datetime


class TimetableEntry(db.Model):
    __tablename__ = 'timetable_entries'

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(5))
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.String(5), nullable=False)  # "09:00"
    end_time = db.Column(db.String(5), nullable=False)    # "10:00"
    room = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department', backref='timetable_entries')
    attendance_records = db.relationship('AttendanceRecord', backref='timetable_entry', lazy='dynamic')

    DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'subject_code': self.subject.code if self.subject else None,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.user.full_name if self.faculty and self.faculty.user else None,
            'department_id': self.department_id,
            'semester': self.semester,
            'section': self.section,
            'day_of_week': self.day_of_week,
            'day_name': self.DAY_NAMES[self.day_of_week] if 0 <= self.day_of_week <= 6 else None,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'room': self.room,
        }
