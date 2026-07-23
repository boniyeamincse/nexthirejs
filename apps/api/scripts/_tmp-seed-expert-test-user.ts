import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as argon2 from 'argon2';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL not set');
  const adapter = new PrismaPg(connectionString);
  const prisma = new PrismaClient({ adapter });

  const role = await prisma.role.upsert({
    where: { code: 'candidate' },
    update: {},
    create: { code: 'candidate', name: 'Candidate', isSystem: true },
  });

  const passwordHash = await argon2.hash('UiTest#2026', { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email: 'ui-expert-flow-test@example.com' },
    update: { passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: {
      email: 'ui-expert-flow-test@example.com',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: role.id } },
    },
  });

  console.log('ready:', user.email);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
