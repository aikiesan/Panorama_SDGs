import aiosmtplib
from email.message import EmailMessage
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, html_content: str):
    """Send an email using SMTP settings"""
    if not settings.SMTP_HOST or settings.SMTP_HOST == "smtp.example.com":
        logger.warning(f"SMTP not configured (HOST={settings.SMTP_HOST}). Email to {to_email} suppressed.")
        return

    message = EmailMessage()
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(html_content, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True if settings.SMTP_PORT == 465 else False,
            start_tls=True if settings.SMTP_PORT == 587 else False,
        )
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")

async def send_changes_requested_email(to_email: str, project_name: str, edit_link: str, notes: str):
    subject = f"Action Required: Update your submission for {project_name}"
    content = f"""
    <html>
    <body style="font-family: sans-serif; color: #333;">
        <h2>Updates Requested for {project_name}</h2>
        <p>Thank you for your submission to Panorama SDG.</p>
        <p>Our review team has requested some changes before we can publish your project.</p>
        <p><strong>Reviewer Notes:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc; margin: 20px 0;">
            {notes}
        </blockquote>
        <p>Please use the following secure link to edit and resubmit your project:</p>
        <p style="margin: 20px 0;">
            <a href="{edit_link}" style="background: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Edit Project</a>
        </p>
        <p><small>Or copy this URL: {edit_link}</small></p>
        <p>This link allows you to edit your specific submission.</p>
    </body>
    </html>
    """
    await send_email(to_email, subject, content)

async def send_approval_email(to_email: str, project_name: str, public_link: str):
    subject = f"Your project {project_name} has been published!"
    content = f"""
    <html>
    <body style="font-family: sans-serif; color: #333;">
        <h2>Congratulations!</h2>
        <p>Your project <strong>{project_name}</strong> has been approved and published on Panorama SDG.</p>
        <p style="margin: 20px 0;">
            <a href="{public_link}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Project</a>
        </p>
    </body>
    </html>
    """
    await send_email(to_email, subject, content)

async def send_rejection_email(to_email: str, project_name: str, reason: str):
    subject = f"Update on your submission for {project_name}"
    content = f"""
    <html>
    <body style="font-family: sans-serif; color: #333;">
        <h2>Project Submission Update</h2>
        <p>Thank you for submitting <strong>{project_name}</strong> to Panorama SDG.</p>
        <p>After careful review, we are unable to publish your project at this time.</p>
        <p><strong>Reason:</strong> {reason}</p>
    </body>
    </html>
    """
    await send_email(to_email, subject, content)

async def send_submission_notification(admin_email: str, project_name: str, review_link: str):
    subject = f"New Project Submission: {project_name}"
    content = f"""
    <html>
    <body style="font-family: sans-serif; color: #333;">
        <h2>New Submission</h2>
        <p>A new project <strong>{project_name}</strong> has been submitted.</p>
        <p style="margin: 20px 0;">
            <a href="{review_link}" style="background: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Review Submission</a>
        </p>
    </body>
    </html>
    """
    await send_email(admin_email, subject, content)
