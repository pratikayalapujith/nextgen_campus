from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.models.student import Student
from app.utils.decorators import role_required
from app.utils.helpers import paginate_query

students_bp = Blueprint('students', __name__, url_prefix='/api/students')


@students_bp.route('', methods=['GET'])
@role_required('admin', 'faculty')
def list_students():
    query = Student.query.join(User)

    department_id = request.args.get('department_id', type=int)
    semester = request.args.get('semester', type=int)
    section = request.args.get('section')
    search = request.args.get('search')

    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section)
    if search:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f'%{search}%'),
                Student.roll_number.ilike(f'%{search}%'),
            )
        )

    query = query.order_by(Student.roll_number)

    def student_dict(s):
        d = s.to_dict()
        d['full_name'] = s.user.full_name if s.user else None
        d['email'] = s.user.email if s.user else None
        return d

    return jsonify(paginate_query(query, student_dict))


@students_bp.route('/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    claims = get_jwt()
    student = Student.query.get_or_404(student_id)

    # Students can only view their own profile
    if claims['role'] == 'student':
        current_user_id = int(get_jwt_identity())
        if student.user_id != current_user_id:
            return jsonify(error='Access denied'), 403

    data = student.to_dict()
    data['full_name'] = student.user.full_name
    data['email'] = student.user.email
    data['phone'] = student.user.phone
    return jsonify(student=data)


@students_bp.route('', methods=['POST'])
@role_required('admin')
def create_student():
    data = request.get_json()

    required = ['email', 'password', 'full_name', 'roll_number', 'department_id', 'semester', 'admission_year']
    for field in required:
        if not data.get(field):
            return jsonify(error=f'{field} is required'), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify(error='Email already registered'), 409
    if Student.query.filter_by(roll_number=data['roll_number']).first():
        return jsonify(error='Roll number already exists'), 409

    user = User(
        email=data['email'],
        full_name=data['full_name'],
        role='student',
        phone=data.get('phone'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    student = Student(
        user_id=user.id,
        roll_number=data['roll_number'],
        department_id=data['department_id'],
        semester=data['semester'],
        section=data.get('section'),
        admission_year=data['admission_year'],
        guardian_name=data.get('guardian_name'),
        guardian_phone=data.get('guardian_phone'),
        address=data.get('address'),
    )
    db.session.add(student)
    db.session.commit()

    result = student.to_dict()
    result['full_name'] = user.full_name
    result['email'] = user.email
    return jsonify(student=result), 201


@students_bp.route('/<int:student_id>', methods=['PUT'])
@role_required('admin')
def update_student(student_id):
    student = Student.query.get_or_404(student_id)
    data = request.get_json()

    if 'full_name' in data:
        student.user.full_name = data['full_name']
    if 'phone' in data:
        student.user.phone = data['phone']
    if 'semester' in data:
        student.semester = data['semester']
    if 'section' in data:
        student.section = data['section']
    if 'department_id' in data:
        student.department_id = data['department_id']
    if 'guardian_name' in data:
        student.guardian_name = data['guardian_name']
    if 'guardian_phone' in data:
        student.guardian_phone = data['guardian_phone']
    if 'address' in data:
        student.address = data['address']

    db.session.commit()

    result = student.to_dict()
    result['full_name'] = student.user.full_name
    result['email'] = student.user.email
    return jsonify(student=result)


@students_bp.route('/<int:student_id>', methods=['DELETE'])
@role_required('admin')
def delete_student(student_id):
    student = Student.query.get_or_404(student_id)
    user = student.user
    db.session.delete(user)  # cascades to student
    db.session.commit()
    return jsonify(message='Student deleted successfully')
