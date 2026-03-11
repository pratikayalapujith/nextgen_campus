from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import date
from app.extensions import db
from app.models.facility import FacilityBooking
from app.utils.decorators import role_required
from app.utils.helpers import paginate_query

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route('', methods=['GET'])
@jwt_required()
def list_bookings():
    claims = get_jwt()
    identity = int(get_jwt_identity())
    query = FacilityBooking.query

    status = request.args.get('status')
    facility_id = request.args.get('facility_id', type=int)

    if status:
        query = query.filter(FacilityBooking.status == status)
    if facility_id:
        query = query.filter(FacilityBooking.facility_id == facility_id)

    # Non-admin users only see their own bookings
    if claims['role'] != 'admin':
        query = query.filter(FacilityBooking.booked_by == identity)

    query = query.order_by(FacilityBooking.date.desc(), FacilityBooking.start_time)
    return jsonify(paginate_query(query))


@bookings_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    data = request.get_json()
    required = ['facility_id', 'purpose', 'date', 'start_time', 'end_time']
    for field in required:
        if not data.get(field):
            return jsonify(error=f'{field} is required'), 400

    identity = int(get_jwt_identity())
    booking_date = date.fromisoformat(data['date'])

    # Check for time conflicts with approved bookings
    conflict = FacilityBooking.query.filter_by(
        facility_id=data['facility_id'],
        date=booking_date,
        status='approved',
    ).filter(
        FacilityBooking.start_time < data['end_time'],
        FacilityBooking.end_time > data['start_time'],
    ).first()

    if conflict:
        return jsonify(error='Time slot conflicts with an existing approved booking'), 409

    booking = FacilityBooking(
        facility_id=data['facility_id'],
        booked_by=identity,
        purpose=data['purpose'],
        date=booking_date,
        start_time=data['start_time'],
        end_time=data['end_time'],
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking=booking.to_dict()), 201


@bookings_bp.route('/<int:booking_id>/approve', methods=['PUT'])
@role_required('admin')
def approve_booking(booking_id):
    booking = FacilityBooking.query.get_or_404(booking_id)
    if booking.status != 'pending':
        return jsonify(error='Can only approve pending bookings'), 400

    booking.status = 'approved'
    booking.approved_by = int(get_jwt_identity())
    db.session.commit()
    return jsonify(booking=booking.to_dict())


@bookings_bp.route('/<int:booking_id>/reject', methods=['PUT'])
@role_required('admin')
def reject_booking(booking_id):
    booking = FacilityBooking.query.get_or_404(booking_id)
    if booking.status != 'pending':
        return jsonify(error='Can only reject pending bookings'), 400

    booking.status = 'rejected'
    booking.approved_by = int(get_jwt_identity())
    db.session.commit()
    return jsonify(booking=booking.to_dict())


@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    booking = FacilityBooking.query.get_or_404(booking_id)
    identity = int(get_jwt_identity())
    claims = get_jwt()

    if claims['role'] != 'admin' and booking.booked_by != identity:
        return jsonify(error='Access denied'), 403

    booking.status = 'cancelled'
    db.session.commit()
    return jsonify(message='Booking cancelled')
