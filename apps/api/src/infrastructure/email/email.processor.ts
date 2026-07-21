import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { MAIL_QUEUE, SEND_VERIFICATION_EMAIL_JOB } from './email.constants';
import type { SendVerificationEmailPayload } from './email.service';

interface VerificationTemplate {
  subject: string;
  html: string;
  text: string;
}

function buildVerificationEmail(token: string): VerificationTemplate {
  const verifyUrl = `http://localhost:3000/verify-email?token=${encodeURIComponent(token)}`;

  return {
    subject: 'Verify your NextHire email address',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:24px;background:#f5f5f5">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:8px;padding:32px">
<h1 style="font-size:20px;margin:0 0 16px">Verify your email</h1>
<p style="color:#444;line-height:1.6">Thanks for creating a NextHire candidate account. Please verify your email address by clicking the button below.</p>
<a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:600">Verify email</a>
<p style="color:#666;font-size:13px">Or copy this link into your browser:<br><a href="${verifyUrl}" style="color:#2563eb">${verifyUrl}</a></p>
<p style="color:#888;font-size:12px;margin-top:24px">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
</div></body></html>`,
    text: `Verify your email\n\nThanks for creating a NextHire candidate account. Please verify your email address by visiting:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
  };
}

@Processor(MAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST', 'localhost'),
        port: this.configService.get<number>('MAIL_PORT', 1025),
        secure: false,
        ignoreTLS: true,
      });
    }
    return this.transporter;
  }

  async process(job: Job<SendVerificationEmailPayload>): Promise<{ sent: boolean; to: string }> {
    if (job.name !== SEND_VERIFICATION_EMAIL_JOB) {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    const { email, token } = job.data;

    if (!email || typeof email !== 'string' || !token || typeof token !== 'string') {
      throw new Error('Invalid send-verification-email job payload');
    }

    const template = buildVerificationEmail(token);
    const fromAddress = this.configService.get<string>(
      'MAIL_FROM_ADDRESS',
      'no-reply@mnexthire.local',
    );
    const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'NextHire');

    try {
      await this.getTransporter().sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      this.logger.log(`Verification email sent to ${email}`);
      return { sent: true, to: email };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
