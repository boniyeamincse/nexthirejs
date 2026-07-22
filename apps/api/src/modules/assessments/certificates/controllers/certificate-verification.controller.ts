import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../auth/decorators/public.decorator';
import { CertificateVerificationService } from '../services/certificate-verification.service';

@ApiTags('Public Certificate Verification')
@Controller('v1/public/certificates/verify')
export class CertificateVerificationController {
  constructor(private readonly verificationService: CertificateVerificationService) {}

  @Get(':verificationCode')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify a certificate by verification code' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyCertificate(@Param('verificationCode') verificationCode: string) {
    return this.verificationService.verify(verificationCode);
  }
}
