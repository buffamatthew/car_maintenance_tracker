import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.models.settings import Settings


def get_smtp_config():
    return {
        'host': Settings.get('smtp_host', ''),
        'port': int(Settings.get('smtp_port', '587')),
        'username': Settings.get('smtp_username', ''),
        'password': Settings.get('smtp_password', ''),
        'use_tls': Settings.get('smtp_use_tls', 'true').lower() == 'true',
    }


def send_email(to_email, subject, html_body):
    config = get_smtp_config()
    if not config['host'] or not config['username'] or not config['password']:
        raise ValueError('SMTP not configured. Please set up email settings.')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = config['username']
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP(config['host'], config['port']) as server:
        if config['use_tls']:
            server.starttls()
        server.login(config['username'], config['password'])
        server.sendmail(config['username'], to_email, msg.as_string())


def send_test_email():
    to_email = Settings.get('notification_email', '')
    if not to_email:
        raise ValueError('No notification email configured.')

    send_email(
        to_email,
        'Upkeep - Test Notification',
        '<h2>Upkeep</h2><p>This is a test email. Your notification settings are working correctly!</p>'
    )


def send_reminder_email(to_email, items_due):
    if not items_due:
        return

    rows = ''
    for item in items_due:
        status_color = '#ef4444' if item['status'] == 'overdue' else '#f59e0b'
        status_label = 'Overdue' if item['status'] == 'overdue' else 'Due Soon'
        rows += f'''
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{item['asset_name']}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{item['item_name']}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: {status_color}; font-weight: bold;">{status_label}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{item['remaining']}</td>
        </tr>'''

    html = f'''
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #282c34; padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Upkeep</h1>
        </div>
        <div style="padding: 20px;">
            <h2>Maintenance Reminder</h2>
            <p>The following maintenance items need your attention:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 8px; text-align: left;">Asset</th>
                        <th style="padding: 8px; text-align: left;">Item</th>
                        <th style="padding: 8px; text-align: left;">Status</th>
                        <th style="padding: 8px; text-align: left;">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    </div>
    '''

    send_email(to_email, f'Upkeep - {len(items_due)} item(s) need attention', html)
