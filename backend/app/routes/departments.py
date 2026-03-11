from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.department import Department
from app.utils.decorators import role_required

departments_bp = Blueprint('departments', __name__, url_prefix='/api/departments')


@departments_bp.route('', methods=['GET'])
@jwt_required()
def list_departments():
    departments = Department.query.order_by(Department.name).all()
    return jsonify(departments=[d.to_dict() for d in departments])


@departments_bp.route('/<int:dept_id>', methods=['GET'])
@jwt_required()
def get_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = dept.to_dict()
    data['student_count'] = dept.students.count()
    data['faculty_count'] = dept.faculty_members.count()
    return jsonify(department=data)


@departments_bp.route('', methods=['POST'])
@role_required('admin')
def create_department():
    data = request.get_json()
    if not data.get('name') or not data.get('code'):
        return jsonify(error='name and code are required'), 400

    if Department.query.filter_by(code=data['code']).first():
        return jsonify(error='Department code already exists'), 409

    dept = Department(name=data['name'], code=data['code'])
    db.session.add(dept)
    db.session.commit()
    return jsonify(department=dept.to_dict()), 201


@departments_bp.route('/<int:dept_id>', methods=['PUT'])
@role_required('admin')
def update_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    data = request.get_json()

    if 'name' in data:
        dept.name = data['name']
    if 'code' in data:
        dept.code = data['code']

    db.session.commit()
    return jsonify(department=dept.to_dict())


@departments_bp.route('/<int:dept_id>', methods=['DELETE'])
@role_required('admin')
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    if dept.students.count() > 0 or dept.faculty_members.count() > 0:
        return jsonify(error='Cannot delete department with existing students or faculty'), 400
    db.session.delete(dept)
    db.session.commit()
    return jsonify(message='Department deleted successfully')
