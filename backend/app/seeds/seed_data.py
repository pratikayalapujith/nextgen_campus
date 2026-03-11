from app.extensions import db
from app.models.user import User
from app.models.department import Department
from app.models.facility import Facility


def seed():
    # Create admin user
    admin = User.query.filter_by(email='admin@campus.com').first()
    if not admin:
        admin = User(
            email='admin@campus.com',
            full_name='System Admin',
            role='admin',
            phone='9999999999',
        )
        admin.set_password('admin123')
        db.session.add(admin)

    # Create departments
    departments = [
        ('Computer Science & Engineering', 'CSE'),
        ('Electronics & Communication', 'ECE'),
        ('Mechanical Engineering', 'ME'),
        ('Civil Engineering', 'CE'),
        ('Electrical Engineering', 'EE'),
    ]
    for name, code in departments:
        if not Department.query.filter_by(code=code).first():
            db.session.add(Department(name=name, code=code))

    # Create facilities
    facilities = [
        ('Computer Lab 1', 'lab', 60, 'Block A, Floor 2'),
        ('Computer Lab 2', 'lab', 40, 'Block A, Floor 3'),
        ('Seminar Hall', 'seminar_room', 200, 'Block B, Floor 1'),
        ('Auditorium', 'hall', 500, 'Main Building'),
        ('Sports Ground', 'sports', 300, 'Campus Ground'),
        ('Library Hall', 'hall', 150, 'Library Building'),
    ]
    for name, ftype, capacity, location in facilities:
        if not Facility.query.filter_by(name=name).first():
            db.session.add(Facility(name=name, type=ftype, capacity=capacity, location=location))

    db.session.commit()
    print('Seed data created successfully!')
