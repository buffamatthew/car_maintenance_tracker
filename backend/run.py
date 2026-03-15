from app import create_app, db
import sqlite3

app = create_app()


def run_migrations(app):
    """Add new columns to existing tables if they don't exist."""
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check and add new columns to maintenance_items
        cursor.execute("PRAGMA table_info(maintenance_items)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'reminders_enabled' not in columns:
            cursor.execute("ALTER TABLE maintenance_items ADD COLUMN reminders_enabled BOOLEAN DEFAULT 0")
        if 'last_reminder_sent' not in columns:
            cursor.execute("ALTER TABLE maintenance_items ADD COLUMN last_reminder_sent DATETIME")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Migration note: {e}")


with app.app_context():
    db.create_all()
    run_migrations(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
