from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.facility import Facility, FacilityBooking
from app.utils.decorators import role_required
from datetime import date

facilities_bp = Blueprint('facilities', __name__, url_prefix='/api/facilities')


@facilities_bp.route('', methods=['GET'])
@jwt_required()
def list_facilities():
    facilities = Facility.query.order_by(Facility.name).all()
    return jsonify(facilities=[f.to_dict() for f in facilities])


@facilities_bp.route('/<int:facility_id>', methods=['GET'])
@jwt_required()
def get_facility(facility_id):
    facility = Facility.query.get_or_404(facility_id)
    return jsonify(facility=facility.to_dict())


@facilities_bp.route('', methods=['POST'])
@role_required('admin')
def create_facility():
    data = request.get_json()
    if not data.get('name') or not data.get('type'):
        return jsonify(error='name and type are required'), 400

    facility = Facility(
        name=data['name'],
        type=data['type'],
        capacity=data.get('capacity'),
        location=data.get('location'),
        description=data.get('description'),
    )
    db.session.add(facility)
    db.session.commit()
    return jsonify(facility=facility.to_dict()), 201


@facilities_bp.route('/<int:facility_id>', methods=['PUT'])
@role_required('admin')
def update_facility(facility_id):
    facility = Facility.query.get_or_404(facility_id)
    data = request.get_json()

    for field in ['name', 'type', 'capacity', 'location', 'description', 'is_available']:
        if field in data:
            setattr(facility, field, data[field])

    db.session.commit()
    return jsonify(facility=facility.to_dict())


@facilities_bp.route('/<int:facility_id>', methods=['DELETE'])
@role_required('admin')
def delete_facility(facility_id):
    facility = Facility.query.get_or_404(facility_id)
    db.session.delete(facility)
    db.session.commit()
    return jsonify(message='Facility deleted successfully')


@facilities_bp.route('/<int:facility_id>/availability', methods=['GET'])
@jwt_required()
def check_availability(facility_id):
    check_date = request.args.get('date')
    if not check_date:
        return jsonify(error='date parameter is required'), 400

    bookings = FacilityBooking.query.filter_by(
        facility_id=facility_id,
        date=date.fromisoformat(check_date),
        status='approved',
    ).order_by(FacilityBooking.start_time).all()

    return jsonify(
        booked_slots=[{
            'start_time': b.start_time,
            'end_time': b.end_time,
            'purpose': b.purpose,
        } for b in bookings]
    )
