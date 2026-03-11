from app.extensions import db
from datetime import datetime


class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    timetable_entry_id = db.Column(db.Integer, db.ForeignKey('timetable_entries.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(10), nullable=False)  # present, absent, late
    marked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'timetable_entry_id', 'date', name='uq_attendance'),
    )

    marker = db.relationship('User', backref='marked_attendance')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.user.full_name if self.student and self.student.user else None,
            'roll_number': self.student.roll_number if self.student else None,
            'timetable_entry_id': self.timetable_entry_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'marked_by': self.marked_by,
        }
