import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';
import { RegistrationService, RegistrationResult } from './registration.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';

@Controller('auth')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('register/candidate')
  @Public()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register a new candidate account',
    description:
      'Creates a pending-verification candidate account. Password must meet complexity requirements. No session or token is created.',
  })
  @ApiBody({ type: RegisterCandidateDto })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully (pending verification)',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        status: { type: 'string', example: 'PENDING_VERIFICATION' },
        emailVerificationRequired: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async register(@Body() dto: RegisterCandidateDto): Promise<RegistrationResult> {
    return this.registrationService.register(dto);
  }
}
