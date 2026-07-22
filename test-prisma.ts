import { PrismaClient } from './apps/api/src/generated/prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    await prisma.assessment.findFirst({
      where: {
        OR: [{ id: 'invalid-uuid' }, { slug: 'invalid-uuid' }],
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
