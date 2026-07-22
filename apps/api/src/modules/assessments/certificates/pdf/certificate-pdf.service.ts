import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface CertificateData {
  holderName: string;
  assessmentTitle: string;
  scorePercentage: number;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt: Date | null;
  verificationUrl: string;
}

@Injectable()
export class CertificatePdfService {
  private readonly logger = new Logger(CertificatePdfService.name);

  generate(data: CertificateData): Buffer {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Certificate - ${data.assessmentTitle}`,
          Author: 'NextHire',
          Subject: 'Assessment Completion Certificate',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#1a365d');

      // Header bar
      doc.rect(0, 60, doc.page.width, 4).fill('#2b6cb0');

      // Branding
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1a365d')
        .text('NextHire', 50, 80, { align: 'center' });

      doc.fontSize(14).font('Helvetica').fillColor('#4a5568')
        .text('Certificate of Completion', { align: 'center' });

      // Separator
      doc.moveTo(200, 140).lineTo(doc.page.width - 200, 140).stroke('#cbd5e0');

      // Holder name
      doc.fontSize(12).fillColor('#718096')
        .text('This certifies that', { align: 'center' });

      doc.fontSize(26).font('Helvetica-Bold').fillColor('#2d3748')
        .text(data.holderName, { align: 'center' });

      doc.fontSize(12).font('Helvetica').fillColor('#718096')
        .text('has successfully completed the assessment', { align: 'center' });

      doc.fontSize(20).font('Helvetica-Bold').fillColor('#2b6cb0')
        .text(data.assessmentTitle, { align: 'center' });

      // Score
      doc.fontSize(12).font('Helvetica').fillColor('#718096')
        .text('with a score of', { align: 'center' });

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#2d3748')
        .text(`${data.scorePercentage}%`, { align: 'center' });

      // Issue details
      const issueDate = data.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(10).font('Helvetica').fillColor('#718096')
        .text(`Issued: ${issueDate}`, 50, 330);

      if (data.expiresAt) {
        const expiryDate = data.expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Expires: ${expiryDate}`, 50, 346);
      }

      // Certificate number
      doc.fontSize(8).font('Helvetica').fillColor('#a0aec0')
        .text(`Certificate No: ${data.certificateNumber}`, 50, doc.page.height - 100);

      // Verification URL
      doc.fontSize(8).font('Helvetica').fillColor('#a0aec0')
        .text(`Verify at: ${data.verificationUrl}`, 50, doc.page.height - 85);

      // Disclaimer
      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#a0aec0')
        .text(
          'This certificate verifies completion of a NextHire platform assessment only. It does not represent government accreditation, university credit, professional licensing, or employer endorsement.',
          50,
          doc.page.height - 65,
          { align: 'center', width: doc.page.width - 100 },
        );

      doc.end();
    }) as unknown as Buffer;
  }

  generateVerificationUrl(verificationCode: string): string {
    return `/verify-certificate/${verificationCode}`;
  }
}
