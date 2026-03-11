from app.extensions import db
from datetime import datetime


class Facility(db.Model):
    __tablename__ = 'facilities'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(30), nullable=False)  # lab, hall, seminar_room, sports
    capacity = db.Column(db.Integer)
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship('FacilityBooking', backref='facility', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'capacity': self.capacity,
            'location': self.location,
            'description': self.description,
            'is_available': self.is_available,
        }


class FacilityBooking(db.Model):
    __tablename__ = 'facility_bookings'

    id = db.Column(db.Integer, primary_key=True)
    facility_id = db.Column(db.Integer, db.ForeignKey('facilities.id'), nullable=False)
    booked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    purpose = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, cancelled
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booker = db.relationship('User', foreign_keys=[booked_by], backref='bookings')
    approver = db.relationship('User', foreign_keys=[approved_by])

    def to_dict(self):
        return {
            'id': self.id,
            'facility_id': self.facility_id,
            'facility_name': self.facility.name if self.facility else None,
            'booked_by': self.booked_by,
            'booker_name': self.booker.full_name if self.booker else None,
            'purpose': self.purpose,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'status': self.status,
            'approved_by': self.approved_by,
        }
