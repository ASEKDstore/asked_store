// Export PrismaClient class and types only
// Do NOT create instances here - they should be created in the consuming application
// This keeps packages/db as a pure library without side effects

export { PrismaClient } from '@prisma/client'
export * from '@prisma/client'

