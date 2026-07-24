import { Injectable, Logger } from '@nestjs/common';

export interface SettingsGroup {
  [key: string]: any;
}

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger(AdminSettingsService.name);

  private settings: Record<string, SettingsGroup> = {
    general: {
      platformName: 'NextHire',
      platformDescription: 'AI-powered recruitment platform',
      logo: null,
      favicon: null,
      contactEmail: 'contact@nexthire.com',
      contactPhone: '+1-800-NEXTHIRE',
      address: '123 Tech Street, San Francisco, CA 94105',
      socialLinks: { facebook: '', twitter: '', linkedin: '', youtube: '' },
      seo: { metaTags: 'nexthire, recruitment, ai hiring', analyticsId: '' },
    },
    booking: {
      cancellationWindow: 24,
      refundPolicy: 'full_refund',
      rescheduleWindow: 12,
      rescheduleLimit: 3,
      disputeWindow: 7,
      noShowPolicy: 'charge_full',
      meetingProvider: 'zoom',
      meetingDurationMin: 30,
      meetingDurationMax: 120,
    },
    payment: {
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      gatewayPriority: ['stripe', 'paypal'],
      transactionFee: 2.9,
      vatRate: 20,
      taxExemptions: false,
      invoicePrefix: 'INV-',
      invoiceNumberFormat: 'YYYY-XXXX',
    },
    notifications: {
      defaultPreferences: { candidate: { email: true, sms: false, push: true, inApp: true }, expert: { email: true, sms: true, push: true, inApp: true } },
      channels: { email: { enabled: true, provider: 'smtp' }, sms: { enabled: false, provider: 'twilio' }, push: { enabled: true, provider: 'firebase' }, inApp: { enabled: true } },
      digest: { frequency: 'daily', content: ['new_bookings', 'messages', 'reminders'] },
    },
    privacy: {
      dataRetention: { userData: 365, transactionData: 1825, logData: 90 },
      consentManagement: { defaultConsents: ['terms', 'privacy', 'marketing'], consentVersions: ['v1', 'v2'] },
      gdpr: { policyVersion: '2.1', lastUpdated: '2026-01-15' },
      cookies: { essential: true, functional: true, analytics: false, marketing: false },
    },
    security: {
      password: { minLength: 8, specialChars: true, expiryDays: 90, historyCount: 5 },
      session: { timeoutMinutes: 60, concurrentSessions: 5, rememberMeDays: 30 },
      mfa: { enforceForRoles: ['super_admin', 'admin'], recoveryCodes: 10 },
      ipRestrictions: { whitelist: [], blocklist: [] },
      securityHeaders: { xFrameOptions: 'DENY', xssProtection: '1; mode=block', hsts: 'max-age=31536000' },
    },
  };

  async getAllSettings() {
    return { settings: this.settings };
  }

  async getSettingsGroup(group: string) {
    const data = this.settings[group];
    if (!data) return { error: `Settings group '${group}' not found` };
    return { group, settings: data };
  }

  async updateSettingsGroup(group: string, updates: Record<string, any>) {
    if (!this.settings[group]) {
      return { error: `Settings group '${group}' not found` };
    }
    this.deepMerge(this.settings[group], updates);
    this.logger.log(`Settings '${group}' updated`);
    return { group, settings: this.settings[group], message: 'Settings updated successfully' };
  }

  async resetSettingsGroup(group: string) {
    this.logger.warn(`Settings '${group}' reset requested - not implemented for production`);
    return { message: 'Reset not available in demo mode' };
  }

  private deepMerge(target: any, source: any) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}
