import { PrismaClient } from '@prisma/client'

export { PrismaClient }
export * from '@prisma/client'

// Export singleton instance
export const prisma = new PrismaClient()

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
