from app.extensions import db
from datetime import datetime


class Faculty(db.Model):
    __tablename__ = 'faculty'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    designation = db.Column(db.String(50))
    qualification = db.Column(db.String(100))
    date_of_joining = db.Column(db.Date)
    specialization = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subjects = db.relationship('Subject', backref='faculty', lazy='dynamic')
    timetable_entries = db.relationship('TimetableEntry', backref='faculty', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'employee_id': self.employee_id,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'designation': self.designation,
            'qualification': self.qualification,
            'date_of_joining': self.date_of_joining.isoformat() if self.date_of_joining else None,
            'specialization': self.specialization,
        }
