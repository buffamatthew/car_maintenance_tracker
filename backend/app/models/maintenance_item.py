from app import db
from datetime import datetime

class MaintenanceItem(db.Model):
    __tablename__ = 'maintenance_items'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    maintenance_type = db.Column(db.String(20), nullable=False)  # 'mileage' or 'time'
    frequency_value = db.Column(db.Integer, nullable=False)  # miles or days
    frequency_unit = db.Column(db.String(20), nullable=False)  # 'miles', 'days', 'months', 'years'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    maintenance_logs = db.relationship('MaintenanceLog', backref='maintenance_item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_id': self.vehicle_id,
            'name': self.name,
            'maintenance_type': self.maintenance_type,
            'frequency_value': self.frequency_value,
            'frequency_unit': self.frequency_unit,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<MaintenanceItem {self.name} for Vehicle {self.vehicle_id}>'
