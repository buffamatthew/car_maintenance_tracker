from app import db
from datetime import datetime

class GeneralMaintenance(db.Model):
    __tablename__ = 'general_maintenance'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)  # What was done
    date_performed = db.Column(db.Date, nullable=False)
    mileage = db.Column(db.Integer)
    cost = db.Column(db.Numeric(10, 2))  # Store cost with 2 decimal places
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to attachments
    attachments = db.relationship('Attachment', backref='general_maintenance', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'description': self.description,
            'date_performed': self.date_performed.isoformat() if self.date_performed else None,
            'mileage': self.mileage,
            'cost': float(self.cost) if self.cost else None,
            'notes': self.notes,
            'attachments': [att.to_dict() for att in self.attachments] if self.attachments else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<GeneralMaintenance {self.id} {self.description}>'
