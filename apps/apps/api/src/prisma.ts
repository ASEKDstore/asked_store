import { PrismaClient } from '@prisma/client'

// Prisma client is generated from packages/db/prisma/schema.prisma
// Make sure to run `npm run db:generate` before starting the API
export const prisma = new PrismaClient()

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})