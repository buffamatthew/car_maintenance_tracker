from app import db
from datetime import datetime

class MaintenanceLog(db.Model):
    __tablename__ = 'maintenance_logs'

    id = db.Column(db.Integer, primary_key=True)
    maintenance_item_id = db.Column(db.Integer, db.ForeignKey('maintenance_items.id'), nullable=False)
    date_performed = db.Column(db.Date, nullable=False)
    mileage = db.Column(db.Integer)
    notes = db.Column(db.Text)
    receipt_photo = db.Column(db.String(255))  # Path to photo file
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'maintenance_item_id': self.maintenance_item_id,
            'date_performed': self.date_performed.isoformat() if self.date_performed else None,
            'mileage': self.mileage,
            'notes': self.notes,
            'receipt_photo': self.receipt_photo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<MaintenanceLog {self.id} for Item {self.maintenance_item_id}>'
