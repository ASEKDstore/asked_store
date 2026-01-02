import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const fastify = Fastify({
  logger: true
})

// Регистрация плагинов
fastify.register(cors, {
  origin: true,
  credentials: true
})

fastify.register(multipart)

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Базовые роуты для админки
fastify.get('/api/admin/products', async (request, reply) => {
  const products = await prisma.product.findMany({
    include: {
      category: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return products
})

fastify.get('/api/admin/orders', async (request, reply) => {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return orders
})

fastify.get('/api/admin/stats', async (request, reply) => {
  const [totalProducts, totalOrders, totalUsers, lowStockProducts] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.product.count({
      where: {
        stock: {
          lt: 10
        }
      }
    })
  ])

  const totalRevenue = await prisma.order.aggregate({
    where: {
      status: {
        not: 'cancelled'
      }
    },
    _sum: {
      total: true
    }
  })

  return {
    totalProducts,
    totalOrders,
    totalUsers,
    lowStockProducts,
    totalRevenue: totalRevenue._sum.total || 0
  }
})

// Запуск сервера
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 API сервер запущен на порту ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
})

