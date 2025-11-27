from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Register blueprints
    from app.routes import vehicles, maintenance_items, maintenance_logs
    app.register_blueprint(vehicles.bp)
    app.register_blueprint(maintenance_items.bp)
    app.register_blueprint(maintenance_logs.bp)

    # Create upload folder if it doesn't exist
    import os
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app

from app import models
