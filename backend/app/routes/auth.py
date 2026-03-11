from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt
)
from app.extensions import db
from app.models.user import User
from app.models.student import Student
from app.models.faculty import Faculty
from app.models.token_blocklist import TokenBlocklist

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    required = ['email', 'password', 'full_name', 'role']
    for field in required:
        if not data.get(field):
            return jsonify(error=f'{field} is required'), 400

    if data['role'] not in ('admin', 'faculty', 'student'):
        return jsonify(error='Invalid role'), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify(error='Email already registered'), 409

    user = User(
        email=data['email'],
        full_name=data['full_name'],
        role=data['role'],
        phone=data.get('phone'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    if data['role'] == 'student':
        for field in ['roll_number', 'department_id', 'semester', 'admission_year']:
            if not data.get(field):
                db.session.rollback()
                return jsonify(error=f'{field} is required for students'), 400
        student = Student(
            user_id=user.id,
            roll_number=data['roll_number'],
            department_id=data['department_id'],
            semester=data['semester'],
            section=data.get('section'),
            admission_year=data['admission_year'],
            guardian_name=data.get('guardian_name'),
            guardian_phone=data.get('guardian_phone'),
        )
        db.session.add(student)

    elif data['role'] == 'faculty':
        for field in ['employee_id', 'department_id']:
            if not data.get(field):
                db.session.rollback()
                return jsonify(error=f'{field} is required for faculty'), 400
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
    return jsonify(message='User registered successfully', user=user.to_dict()), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify(error='Email and password are required'), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error='Invalid email or password'), 401

    if not user.is_active:
        return jsonify(error='Account is deactivated'), 403

    additional_claims = {'role': user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user.to_dict(),
    )


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify(error='User not found'), 404

    additional_claims = {'role': user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    return jsonify(access_token=access_token)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return jsonify(message='Logged out successfully')


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify(error='User not found'), 404
    return jsonify(user=user.to_dict())


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify(error='User not found'), 404

    data = request.get_json()
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']

    db.session.commit()
    return jsonify(user=user.to_dict())


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()

    if not user.check_password(data.get('current_password', '')):
        return jsonify(error='Current password is incorrect'), 400

    if not data.get('new_password') or len(data['new_password']) < 6:
        return jsonify(error='New password must be at least 6 characters'), 400

    user.set_password(data['new_password'])
    db.session.commit()
    return jsonify(message='Password changed successfully')
