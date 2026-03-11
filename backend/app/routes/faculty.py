from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user import User
from app.models.faculty import Faculty
from app.utils.decorators import role_required
from app.utils.helpers import paginate_query

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')


@faculty_bp.route('', methods=['GET'])
@role_required('admin')
def list_faculty():
    query = Faculty.query.join(User)

    department_id = request.args.get('department_id', type=int)
    search = request.args.get('search')

    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    if search:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f'%{search}%'),
                Faculty.employee_id.ilike(f'%{search}%'),
            )
        )

    query = query.order_by(Faculty.employee_id)

    def faculty_dict(f):
        d = f.to_dict()
        d['full_name'] = f.user.full_name if f.user else None
        d['email'] = f.user.email if f.user else None
        return d

    return jsonify(paginate_query(query, faculty_dict))


@faculty_bp.route('/<int:faculty_id>', methods=['GET'])
@jwt_required()
def get_faculty(faculty_id):
    claims = get_jwt()
    fac = Faculty.query.get_or_404(faculty_id)

    if claims['role'] == 'faculty':
        current_user_id = int(get_jwt_identity())
        if fac.user_id != current_user_id and claims['role'] != 'admin':
            pass  # Faculty can view other faculty

    data = fac.to_dict()
    data['full_name'] = fac.user.full_name
    data['email'] = fac.user.email
    data['phone'] = fac.user.phone
    return jsonify(faculty=data)


@faculty_bp.route('', methods=['POST'])
@role_required('admin')
def create_faculty():
    data = request.get_json()

    required = ['email', 'password', 'full_name', 'employee_id', 'department_id']
    for field in required:
        if not data.get(field):
            return jsonify(error=f'{field} is required'), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify(error='Email already registered'), 409
    if Faculty.query.filter_by(employee_id=data['employee_id']).first():
        return jsonify(error='Employee ID already exists'), 409

    user = User(
        email=data['email'],
        full_name=data['full_name'],
        role='faculty',
        phone=data.get('phone'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    fac = Faculty(
        user_id=user.id,
        employee_id=data['employee_id'],
        department_id=data['department_id'],
        designation=data.get('designation'),
        qualification=data.get('qualification'),
        specialization=data.get('specialization'),
    )
    db.session.add(fac)
    db.session.commit()

    result = fac.to_dict()
    result['full_name'] = user.full_name
    result['email'] = user.email
    return jsonify(faculty=result), 201


@faculty_bp.route('/<int:faculty_id>', methods=['PUT'])
@role_required('admin')
def update_faculty(faculty_id):
    fac = Faculty.query.get_or_404(faculty_id)
    data = request.get_json()

    if 'full_name' in data:
        fac.user.full_name = data['full_name']
    if 'phone' in data:
        fac.user.phone = data['phone']
    if 'department_id' in data:
        fac.department_id = data['department_id']
    if 'designation' in data:
        fac.designation = data['designation']
    if 'qualification' in data:
        fac.qualification = data['qualification']
    if 'specialization' in data:
        fac.specialization = data['specialization']

    db.session.commit()

    result = fac.to_dict()
    result['full_name'] = fac.user.full_name
    result['email'] = fac.user.email
    return jsonify(faculty=result)


@faculty_bp.route('/<int:faculty_id>', methods=['DELETE'])
@role_required('admin')
def delete_faculty(faculty_id):
    fac = Faculty.query.get_or_404(faculty_id)
    user = fac.user
    db.session.delete(user)
    db.session.commit()
    return jsonify(message='Faculty deleted successfully')
