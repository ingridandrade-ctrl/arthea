import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcryptjs.hash('admin123', 10);
  await prisma.user.update({ 
    where: { email: 'admin@arthea.com' }, 
    data: { password: hash } 
  });
  console.log('Senha atualizada com sucesso!');
  console.log('Hash:', hash);
  await prisma.$disconnect();
}

main();
