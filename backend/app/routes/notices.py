from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.notice import Notice
from app.utils.decorators import role_required

notices_bp = Blueprint('notices', __name__, url_prefix='/api/notices')


@notices_bp.route('', methods=['GET'])
@jwt_required()
def list_notices():
    claims = get_jwt()
    query = Notice.query

    category = request.args.get('category')
    if category:
        query = query.filter(Notice.category == category)

    # Filter by target role
    role = claims.get('role')
    query = query.filter(db.or_(Notice.target_role == 'all', Notice.target_role == role))

    query = query.order_by(Notice.is_pinned.desc(), Notice.published_at.desc())
    notices = query.all()
    return jsonify(notices=[n.to_dict() for n in notices])


@notices_bp.route('/<int:notice_id>', methods=['GET'])
@jwt_required()
def get_notice(notice_id):
    notice = Notice.query.get_or_404(notice_id)
    return jsonify(notice=notice.to_dict())


@notices_bp.route('', methods=['POST'])
@role_required('admin', 'faculty')
def create_notice():
    data = request.get_json()
    if not data.get('title') or not data.get('content'):
        return jsonify(error='title and content are required'), 400

    identity = int(get_jwt_identity())
    claims = get_jwt()

    notice = Notice(
        title=data['title'],
        content=data['content'],
        category=data.get('category', 'general'),
        target_role=data.get('target_role', 'all'),
        department_id=data.get('department_id'),
        author_id=identity,
        is_pinned=data.get('is_pinned', False) if claims['role'] == 'admin' else False,
    )
    db.session.add(notice)
    db.session.commit()
    return jsonify(notice=notice.to_dict()), 201


@notices_bp.route('/<int:notice_id>', methods=['PUT'])
@jwt_required()
def update_notice(notice_id):
    notice = Notice.query.get_or_404(notice_id)
    identity = int(get_jwt_identity())
    claims = get_jwt()

    if claims['role'] != 'admin' and notice.author_id != identity:
        return jsonify(error='Access denied'), 403

    data = request.get_json()
    if 'title' in data:
        notice.title = data['title']
    if 'content' in data:
        notice.content = data['content']
    if 'category' in data:
        notice.category = data['category']
    if 'target_role' in data:
        notice.target_role = data['target_role']
    if 'department_id' in data:
        notice.department_id = data['department_id']
    if 'is_pinned' in data and claims['role'] == 'admin':
        notice.is_pinned = data['is_pinned']

    db.session.commit()
    return jsonify(notice=notice.to_dict())


@notices_bp.route('/<int:notice_id>', methods=['DELETE'])
@jwt_required()
def delete_notice(notice_id):
    notice = Notice.query.get_or_404(notice_id)
    identity = int(get_jwt_identity())
    claims = get_jwt()

    if claims['role'] != 'admin' and notice.author_id != identity:
        return jsonify(error='Access denied'), 403

    db.session.delete(notice)
    db.session.commit()
    return jsonify(message='Notice deleted successfully')
