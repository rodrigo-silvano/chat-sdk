import nodemailer from 'nodemailer';
import { db } from '../db.js';
import { settings } from '@chat-sdk/database';
import { eq, inArray } from 'drizzle-orm';
import { decrypt } from '../utils/crypto.js';

export class MailService {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'];
    const records = await db.select().from(settings).where(inArray(settings.key, keys));

    const config: Record<string, string> = {};
    for (const r of records) {
      config[r.key] = decrypt(r.value);
    }

    const host = config['smtp_host'] || process.env.SMTP_HOST;
    const port = config['smtp_port']
      ? parseInt(config['smtp_port'], 10)
      : parseInt(process.env.SMTP_PORT || '587', 10);
    const user = config['smtp_user'] || process.env.SMTP_USER;
    const pass = config['smtp_pass'] || process.env.SMTP_PASS;
    const from = config['smtp_from'] || process.env.SMTP_FROM || 'noreply@chatsdk.com';

    if (!host || !user || !pass) {
      throw new Error('SMTP config not found in settings or environment');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}
