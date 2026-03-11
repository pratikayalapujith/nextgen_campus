def register_blueprints(app):
    from app.routes.auth import auth_bp
    from app.routes.students import students_bp
    from app.routes.faculty import faculty_bp
    from app.routes.departments import departments_bp
    from app.routes.subjects import subjects_bp
    from app.routes.timetable import timetable_bp
    from app.routes.attendance import attendance_bp
    from app.routes.notices import notices_bp
    from app.routes.facilities import facilities_bp
    from app.routes.bookings import bookings_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(timetable_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(notices_bp)
    app.register_blueprint(facilities_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(dashboard_bp)
