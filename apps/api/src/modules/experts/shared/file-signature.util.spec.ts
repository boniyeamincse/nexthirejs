import { detectFileType, verifyFileSignature } from './file-signature.util';

const pdf = () => Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const jpeg = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

describe('file-signature util', () => {
  describe('detectFileType', () => {
    it('detects PDF', () => {
      expect(detectFileType(pdf())).toBe('application/pdf');
    });
    it('detects JPEG', () => {
      expect(detectFileType(jpeg())).toBe('image/jpeg');
    });
    it('detects PNG', () => {
      expect(detectFileType(png())).toBe('image/png');
    });
    it('returns null for unknown content', () => {
      expect(detectFileType(Buffer.from('hello world'))).toBeNull();
    });
    it('returns null for too-short buffer', () => {
      expect(detectFileType(Buffer.from([0x25]))).toBeNull();
    });
  });

  describe('verifyFileSignature', () => {
    it('accepts matching declared MIME', () => {
      expect(verifyFileSignature(pdf(), 'application/pdf')).toBe('application/pdf');
      expect(verifyFileSignature(png(), 'image/png')).toBe('image/png');
    });

    it('normalizes image/jpg to image/jpeg', () => {
      expect(verifyFileSignature(jpeg(), 'image/jpg')).toBe('image/jpeg');
    });

    it('rejects when declared MIME mismatches content', () => {
      // A PNG payload declared as PDF must be rejected (spoofed extension/MIME).
      expect(verifyFileSignature(png(), 'application/pdf')).toBeNull();
    });

    it('rejects disallowed content even with allowed declared MIME', () => {
      expect(verifyFileSignature(Buffer.from('GIF89a'), 'image/png')).toBeNull();
    });
  });
});
