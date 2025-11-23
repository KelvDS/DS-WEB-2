import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter;

async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

export async function sendEmail(to, subject, text) {
  if (!transporter) transporter = await createTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Da\'perfect Studios" <noreply@daperfect.com>',
    to, subject, text
  });
  console.log('Email sent:', info.messageId);
  console.log('Preview:', nodemailer.getTestMessageUrl(info));
  return info;
}