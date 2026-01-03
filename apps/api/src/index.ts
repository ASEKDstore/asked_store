import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { prisma } from './lib/prisma'
import { env } from './config/env'
import { authRoutes } from './routes/auth'
import { productsRoutes } from './routes/products'
import { cartRoutes } from './routes/cart'
import { ordersRoutes } from './routes/orders'
import { meRoutes } from './routes/me'
import { adminRoutes } from './routes/admin'

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

// Регистрация роутов
fastify.register(authRoutes, { prefix: '/api' })
fastify.register(productsRoutes, { prefix: '/api' })
fastify.register(cartRoutes, { prefix: '/api' })
fastify.register(ordersRoutes, { prefix: '/api' })
fastify.register(meRoutes, { prefix: '/api' })
fastify.register(adminRoutes, { prefix: '/api' })

// Запуск сервера
const start = async () => {
  try {
    const port = Number(env.PORT) || 3000
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


