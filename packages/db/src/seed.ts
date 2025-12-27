// Database seed script for roles and permissions

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Define roles
  const roles = [
    { name: 'owner', description: 'System owner - full access' },
    { name: 'admin', description: 'Administrator - management access' },
    { name: 'content', description: 'Content manager - catalog management' },
    { name: 'support', description: 'Support team - orders and user support' },
    { name: 'analyst', description: 'Analyst - read-only access to analytics' },
    { name: 'user', description: 'Regular user - basic access' },
  ]

  // Define permissions
  const permissions = [
    { name: 'admin.access', resource: 'admin', action: 'access', description: 'Access to admin panel' },
    { name: 'catalog.write', resource: 'catalog', action: 'write', description: 'Write access to catalog (create, update, delete products)' },
    { name: 'catalog.read', resource: 'catalog', action: 'read', description: 'Read access to catalog' },
    { name: 'orders.read', resource: 'orders', action: 'read', description: 'Read access to orders' },
    { name: 'channel.write', resource: 'channel', action: 'write', description: 'Write access to channel (publish posts)' },
    { name: 'bot.config', resource: 'bot', action: 'config', description: 'Configure bot settings' },
  ]

  // Create roles
  console.log('📝 Creating roles...')
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    })
    console.log(`  ✓ Role: ${roleData.name}`)
  }

  // Create permissions
  console.log('🔐 Creating permissions...')
  for (const permData of permissions) {
    await prisma.permission.upsert({
      where: { name: permData.name },
      update: {
        description: permData.description,
        resource: permData.resource,
        action: permData.action,
      },
      create: permData,
    })
    console.log(`  ✓ Permission: ${permData.name}`)
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...')

  // Owner: all permissions
  const ownerRole = await prisma.role.findUnique({ where: { name: 'owner' } })
  if (ownerRole) {
    for (const permData of permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permData.name } })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: ownerRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: ownerRole.id,
            permissionId: permission.id,
          },
        })
      }
    }
    console.log(`  ✓ Owner: all permissions (${permissions.length})`)
  }

  // Admin: all permissions except owner-specific
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  if (adminRole) {
    for (const permData of permissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permData.name } })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        })
      }
    }
    console.log(`  ✓ Admin: all permissions (${permissions.length})`)
  }

  // Content: catalog permissions
  const contentRole = await prisma.role.findUnique({ where: { name: 'content' } })
  if (contentRole) {
    const contentPermissions = ['catalog.write', 'catalog.read']
    for (const permName of contentPermissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: contentRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: contentRole.id,
            permissionId: permission.id,
          },
        })
      }
    }
    console.log(`  ✓ Content: ${contentPermissions.join(', ')}`)
  }

  // Support: orders.read
  const supportRole = await prisma.role.findUnique({ where: { name: 'support' } })
  if (supportRole) {
    const permission = await prisma.permission.findUnique({ where: { name: 'orders.read' } })
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: supportRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: supportRole.id,
          permissionId: permission.id,
        },
      })
    }
    console.log(`  ✓ Support: orders.read`)
  }

  // Analyst: catalog.read, orders.read
  const analystRole = await prisma.role.findUnique({ where: { name: 'analyst' } })
  if (analystRole) {
    const analystPermissions = ['catalog.read', 'orders.read']
    for (const permName of analystPermissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: analystRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: analystRole.id,
            permissionId: permission.id,
          },
        })
      }
    }
    console.log(`  ✓ Analyst: ${analystPermissions.join(', ')}`)
  }

  // User: catalog.read (basic read access)
  const userRole = await prisma.role.findUnique({ where: { name: 'user' } })
  if (userRole) {
    const permission = await prisma.permission.findUnique({ where: { name: 'catalog.read' } })
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      })
    }
    console.log(`  ✓ User: catalog.read`)
  }

  console.log('✅ Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

