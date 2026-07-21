import { Test, TestingModule } from '@nestjs/testing';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationController', () => {
  let controller: EmailVerificationController;
  let service: jest.Mocked<EmailVerificationService>;

  const mockService = {
    verify: jest.fn(),
    resend: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailVerificationController],
      providers: [{ provide: EmailVerificationService, useValue: mockService }],
    }).compile();

    controller = module.get<EmailVerificationController>(EmailVerificationController);
    service = module.get(EmailVerificationService);
  });

  describe('verify', () => {
    it('should call service.verify with the token from body', async () => {
      mockService.verify.mockResolvedValue({
        userId: 'user-id',
        email: 'test@example.com',
        verifiedAt: '2026-07-21T10:00:00.000Z',
      });

      const result = await controller.verify({ token: 'some-verification-token' });

      expect(service.verify).toHaveBeenCalledWith('some-verification-token');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('resend', () => {
    it('should call service.resend with the email from body', async () => {
      mockService.resend.mockResolvedValue({ message: 'Verification email sent' });

      const result = await controller.resend({ email: 'test@example.com' });

      expect(service.resend).toHaveBeenCalledWith('test@example.com');
      expect(result.message).toBe('Verification email sent');
    });
  });
});
