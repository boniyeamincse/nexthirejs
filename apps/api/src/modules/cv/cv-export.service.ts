import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@Injectable()
export class CvExportService {
  private readonly logger = new Logger(CvExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async generatePdfHtml(userId: string, cvId: string): Promise<string> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
        sectionContents: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        candidatePreference: { include: { country: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get section contents
    const contents = cv.sectionContents.reduce(
      (acc, content) => {
        acc[content.sectionType] = content.content;
        return acc;
      },
      {} as Record<string, any>,
    );

    const html = this.buildHtmlTemplate(cv, user, contents);

    await this.auditService.recordBestEffort({
      action: 'cv.pdf_generated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cvId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`PDF generated for CV ${cvId}`);

    return html;
  }

  private buildHtmlTemplate(cv: any, user: any, contents: Record<string, any>): string {
    const profile = user.candidateProfile;
    const preference = user.candidatePreference;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cv.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 40px;
            max-width: 8.5in;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 15px;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header .subtitle {
            font-size: 12px;
            color: #666;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            background: #f0f0f0;
            padding: 8px 12px;
            margin-bottom: 10px;
            border-left: 4px solid #007bff;
        }
        .section-content {
            padding-left: 20px;
        }
        .entry {
            margin-bottom: 12px;
        }
        .entry-title {
            font-weight: bold;
            font-size: 12px;
        }
        .entry-subtitle {
            font-size: 11px;
            color: #666;
        }
        .entry-description {
            font-size: 11px;
            margin-top: 4px;
            line-height: 1.4;
        }
        .tag {
            display: inline-block;
            background: #e7f3ff;
            color: #007bff;
            padding: 3px 8px;
            margin: 3px 3px 3px 0;
            border-radius: 3px;
            font-size: 10px;
        }
        .footer {
            font-size: 10px;
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${profile?.fullName || user.email}</h1>
        ${profile?.professionalHeadline ? `<div class="subtitle">${profile.professionalHeadline}</div>` : ''}
        ${preference?.currentCity ? `<div class="subtitle">${preference.currentCity}${preference.country ? ', ' + preference.country.name : ''}</div>` : ''}
    </div>

    ${this.renderSection('Professional Summary', contents.professional_summary)}
    ${this.renderSection('Education', contents.education)}
    ${this.renderSection('Work Experience', contents.work_experience)}
    ${this.renderSection('Skills', contents.skills)}
    ${this.renderSection('Projects', contents.projects)}
    ${this.renderSection('Certifications', contents.certifications)}

    <div class="footer">
        <p>Generated from ${cv.title} on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
    `;
  }

  private renderSection(title: string, content?: any): string {
    if (!content || Object.keys(content).length === 0) {
      return '';
    }

    return `
        <div class="section">
            <div class="section-title">${title}</div>
            <div class="section-content">
                ${JSON.stringify(content)}
            </div>
        </div>
    `;
  }
}
