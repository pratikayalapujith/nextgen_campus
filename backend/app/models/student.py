from app.extensions import db
from datetime import datetime


class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(5))
    admission_year = db.Column(db.Integer, nullable=False)
    date_of_birth = db.Column(db.Date)
    address = db.Column(db.Text)
    guardian_name = db.Column(db.String(100))
    guardian_phone = db.Column(db.String(15))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attendance_records = db.relationship('AttendanceRecord', backref='student', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'roll_number': self.roll_number,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'semester': self.semester,
            'section': self.section,
            'admission_year': self.admission_year,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'address': self.address,
            'guardian_name': self.guardian_name,
            'guardian_phone': self.guardian_phone,
        }
