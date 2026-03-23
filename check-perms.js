require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@demotaller.cl' },
    select: { id: true, email: true, tenantId: true, roleId: true },
  });

  const rolePermissions = user?.roleId
    ? await prisma.rolePermission.count({ where: { roleId: user.roleId } })
    : 0;

  console.log({ user, rolePermissions });
}

main().catch(console.error).finally(() => prisma.$disconnect());
