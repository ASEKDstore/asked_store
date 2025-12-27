// Create Prisma client instance in the Bot application
import { PrismaClient } from '@asked-store/db'

export const prisma = new PrismaClient()

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

