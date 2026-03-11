from app.extensions import db
from datetime import datetime


class Notice(db.Model):
    __tablename__ = 'notices'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(30), default='general')
    target_role = db.Column(db.String(20), default='all')  # all, admin, faculty, student
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', backref='notices')
    department = db.relationship('Department', backref='notices')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'target_role': self.target_role,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'author_id': self.author_id,
            'author_name': self.author.full_name if self.author else None,
            'is_pinned': self.is_pinned,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
        }
