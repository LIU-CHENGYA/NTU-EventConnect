import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_reset_email(to_email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    sender = settings.SMTP_FROM or settings.SMTP_USER

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "重設您的 NTU EventConnect 密碼"
    msg["From"] = sender
    msg["To"] = to_email

    text = (
        f"您好，\n\n"
        f"我們收到了您的密碼重設請求。請點擊以下連結重設您的密碼（1 小時內有效）：\n\n"
        f"{reset_url}\n\n"
        f"如果您沒有要求重設密碼，請忽略此信件。"
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#1a237e">NTU EventConnect 密碼重設</h2>
      <p>您好，</p>
      <p>我們收到了您的密碼重設請求。請點擊下方按鈕重設您的密碼：</p>
      <p style="text-align:center;margin:32px 0">
        <a href="{reset_url}"
           style="background:#1a237e;color:#fff;padding:14px 32px;
                  border-radius:8px;text-decoration:none;font-weight:600">
          重設密碼
        </a>
      </p>
      <p>此連結將在 <strong>1 小時</strong>後失效。</p>
      <p style="color:#888;font-size:13px">如果您沒有要求重設密碼，請忽略此信件。</p>
    </div>
    """

    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender, [to_email], msg.as_string())
