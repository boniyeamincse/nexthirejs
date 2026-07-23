import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findFirst({
    where: { name: { in: ['admin', 'superadmin', 'administrator', 'SUPER_ADMIN'] } }
  });
  
  if (!adminRole) {
    console.log("Admin role not found.");
    const roles = await prisma.role.findMany();
    console.log("Available roles:", roles.map(r => r.name));
    return;
  }
  
  const adminUsers = await prisma.user.findMany({
    where: { roles: { some: { roleId: adminRole.id } } },
    select: { email: true }
  });
  
  console.log("Admin users:", adminUsers);
}
main().then(() => prisma.$disconnect()).catch(console.error);
