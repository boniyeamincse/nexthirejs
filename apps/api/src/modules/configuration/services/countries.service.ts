import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Country } from '@nexthire/types';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveCountries(): Promise<{ countries: Country[] }> {
    const countries = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      select: {
        code: true,
        name: true,
        phoneCode: true,
        defaultCurrency: true,
        defaultTimezone: true,
        supportedLanguages: true,
      }
    });
    
    return { countries };
  }
}
