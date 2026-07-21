import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const candidateRole = await prisma.role.upsert({
    where: { code: 'candidate' },
    update: {},
    create: {
      code: 'candidate',
      name: 'Candidate',
      description: 'Standard candidate and learner account',
      isSystem: true,
    },
  });

  console.log(`Seeded role: ${candidateRole.code} (${candidateRole.id})`);

  const bd = await prisma.country.upsert({
    where: { code: 'BD' },
    update: {},
    create: {
      code: 'BD',
      name: 'Bangladesh',
      phoneCode: '+880',
      defaultCurrency: 'BDT',
      defaultTimezone: 'Asia/Dhaka',
      supportedLanguages: ['en', 'bn'],
      sortOrder: 1,
    },
  });

  const pk = await prisma.country.upsert({
    where: { code: 'PK' },
    update: {},
    create: {
      code: 'PK',
      name: 'Pakistan',
      phoneCode: '+92',
      defaultCurrency: 'PKR',
      defaultTimezone: 'Asia/Karachi',
      supportedLanguages: ['en', 'ur'],
      sortOrder: 2,
    },
  });

  const ind = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: {
      code: 'IN',
      name: 'India',
      phoneCode: '+91',
      defaultCurrency: 'INR',
      defaultTimezone: 'Asia/Kolkata',
      supportedLanguages: ['en', 'hi'],
      sortOrder: 3,
    },
  });

  console.log(`Seeded countries: ${bd.code}, ${pk.code}, ${ind.code}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
