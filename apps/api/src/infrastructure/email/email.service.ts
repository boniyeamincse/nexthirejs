import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  MAIL_QUEUE,
  SEND_VERIFICATION_EMAIL_JOB,
  SEND_PASSWORD_RESET_EMAIL_JOB,
} from './email.constants';

export interface SendVerificationEmailPayload {
  email: string;
  token: string;
  userId: string;
}

export interface SendPasswordResetEmailPayload {
  email: string;
  token: string;
  userId: string;
}

@Injectable()
export class EmailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async enqueueVerificationEmail(payload: SendVerificationEmailPayload): Promise<{
    jobId: string | number | undefined;
    queue: string;
    name: string;
  }> {
    const job = await this.mailQueue.add(SEND_VERIFICATION_EMAIL_JOB, payload);
    return {
      jobId: job.id,
      queue: MAIL_QUEUE,
      name: SEND_VERIFICATION_EMAIL_JOB,
    };
  }

  async enqueuePasswordResetEmail(payload: SendPasswordResetEmailPayload): Promise<{
    jobId: string | number | undefined;
    queue: string;
    name: string;
  }> {
    const job = await this.mailQueue.add(SEND_PASSWORD_RESET_EMAIL_JOB, payload);
    return {
      jobId: job.id,
      queue: MAIL_QUEUE,
      name: SEND_PASSWORD_RESET_EMAIL_JOB,
    };
  }
}
