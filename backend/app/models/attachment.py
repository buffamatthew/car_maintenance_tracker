from app import db
from datetime import datetime

class Attachment(db.Model):
    __tablename__ = 'attachments'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)  # Original filename
    file_path = db.Column(db.String(255), nullable=False)  # Stored path on server
    file_type = db.Column(db.String(50))  # MIME type (image/jpeg, application/pdf, etc.)
    file_size = db.Column(db.Integer)  # Size in bytes

    # Polymorphic association - can belong to different types of records
    maintenance_log_id = db.Column(db.Integer, db.ForeignKey('maintenance_logs.id'))
    general_maintenance_id = db.Column(db.Integer, db.ForeignKey('general_maintenance.id'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'maintenance_log_id': self.maintenance_log_id,
            'general_maintenance_id': self.general_maintenance_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Attachment {self.id} {self.filename}>'
