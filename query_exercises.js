import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const exercises = await prisma.exercise.findMany({ select: { id: true, name: true } });
  console.log(exercises);
}
main().catch(console.error).finally(() => prisma.$disconnect());
