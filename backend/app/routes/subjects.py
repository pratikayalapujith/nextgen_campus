from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.subject import Subject
from app.utils.decorators import role_required

subjects_bp = Blueprint('subjects', __name__, url_prefix='/api/subjects')


@subjects_bp.route('', methods=['GET'])
@jwt_required()
def list_subjects():
    query = Subject.query

    department_id = request.args.get('department_id', type=int)
    semester = request.args.get('semester', type=int)
    faculty_id = request.args.get('faculty_id', type=int)

    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester:
        query = query.filter(Subject.semester == semester)
    if faculty_id:
        query = query.filter(Subject.faculty_id == faculty_id)

    subjects = query.order_by(Subject.code).all()
    return jsonify(subjects=[s.to_dict() for s in subjects])


@subjects_bp.route('/<int:subject_id>', methods=['GET'])
@jwt_required()
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify(subject=subject.to_dict())


@subjects_bp.route('', methods=['POST'])
@role_required('admin')
def create_subject():
    data = request.get_json()
    required = ['code', 'name', 'department_id', 'semester']
    for field in required:
        if not data.get(field):
            return jsonify(error=f'{field} is required'), 400

    if Subject.query.filter_by(code=data['code']).first():
        return jsonify(error='Subject code already exists'), 409

    subject = Subject(
        code=data['code'],
        name=data['name'],
        department_id=data['department_id'],
        semester=data['semester'],
        credits=data.get('credits', 3),
        faculty_id=data.get('faculty_id'),
    )
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject=subject.to_dict()), 201


@subjects_bp.route('/<int:subject_id>', methods=['PUT'])
@role_required('admin')
def update_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()

    for field in ['name', 'department_id', 'semester', 'credits', 'faculty_id']:
        if field in data:
            setattr(subject, field, data[field])

    db.session.commit()
    return jsonify(subject=subject.to_dict())


@subjects_bp.route('/<int:subject_id>', methods=['DELETE'])
@role_required('admin')
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return jsonify(message='Subject deleted successfully')
