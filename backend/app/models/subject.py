from app.extensions import db
from datetime import datetime


class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(15), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    credits = db.Column(db.Integer, default=3)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    timetable_entries = db.relationship('TimetableEntry', backref='subject', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'semester': self.semester,
            'credits': self.credits,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.user.full_name if self.faculty and self.faculty.user else None,
        }
