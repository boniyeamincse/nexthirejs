import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { CompanyProfileSchemaInput } from '@nexthire/validation';

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByOwnerUserId(ownerUserId: string) {
    return this.prisma.company.findUnique({ where: { ownerUserId } });
  }

  countryExists(countryId: string): Promise<boolean> {
    return this.prisma.country
      .count({ where: { id: countryId, isActive: true } })
      .then((n) => n > 0);
  }

  async upsert(ownerUserId: string, data: CompanyProfileSchemaInput) {
    const persistable = {
      name: data.name,
      legalName: data.legalName ?? null,
      website: data.website ?? null,
      industry: data.industry ?? null,
      companySize: data.companySize ?? null,
      headquartersCountryId: data.headquartersCountryId,
      headquartersCity: data.headquartersCity ?? null,
      description: data.description,
    };

    return this.prisma.company.upsert({
      where: { ownerUserId },
      create: { ownerUserId, ...persistable },
      update: persistable,
    });
  }
}
