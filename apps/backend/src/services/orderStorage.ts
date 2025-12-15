import { promises as fs } from 'fs'
import { join } from 'path'
import type { Order } from '../types/order'

const DATA_DIR = join(process.cwd(), 'data')
const ORDERS_FILE = join(DATA_DIR, 'orders.json')

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create data directory:', error)
  }
}

async function readOrders(): Promise<Order[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(ORDERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []
    }
    console.error('Failed to read orders:', error)
    return []
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to write orders:', error)
    throw error
  }
}

export async function saveOrder(order: Order): Promise<Order> {
  const orders = await readOrders()
  orders.push(order)
  await writeOrders(orders)
  return order
}

export async function getOrdersByTgId(tgId: number): Promise<Order[]> {
  const orders = await readOrders()
  return orders.filter(order => order.user.tgId === tgId)
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await readOrders()
  return orders.find(order => order.id === id) || null
}

export async function getAllOrders(): Promise<Order[]> {
  return readOrders()
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  const orders = await readOrders()
  const order = orders.find(o => o.id === id)
  if (!order) return null
  
  order.status = status
  await writeOrders(orders)
  return order
}



