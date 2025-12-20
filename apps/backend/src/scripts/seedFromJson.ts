/**
 * Migration script: Import data from JSON files to PostgreSQL
 * 
 * Usage: npx tsx src/scripts/seedFromJson.ts
 * 
 * This script reads existing JSON files (if present) and imports them into the database.
 * Run this ONCE after setting up the database, before deploying to production.
 * 
 * DO NOT run this automatically on Render - run it manually if needed.
 */

import { prisma } from '../db/prisma.js'
import { promises as fs } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')

async function readJsonFile<T>(filename: string): Promise<T | null> {
  try {
    const filePath = join(DATA_DIR, `${filename}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  ${filename}.json not found, skipping`)
      return null
    }
    throw error
  }
}

async function seedAdmins() {
  const admins = await readJsonFile<Array<{ tgId: number; name?: string }>>('admins')
  if (!admins || admins.length === 0) return

  console.log(`📥 Importing ${admins.length} admins...`)
  for (const admin of admins) {
    try {
      await prisma.admin.upsert({
        where: { tgId: BigInt(admin.tgId) },
        update: { name: admin.name },
        create: {
          tgId: BigInt(admin.tgId),
          name: admin.name,
        },
      })
    } catch (error: any) {
      console.error(`Failed to import admin ${admin.tgId}:`, error.message)
    }
  }
  console.log('✅ Admins imported')
}

async function seedBanners() {
  const banners = await readJsonFile<Array<{
    id: string
    title: string
    subtitle?: string
    description: string
    image: string
    detailsImage?: string
    ctaText?: string
    order?: number
    isActive?: boolean
    createdAt: string
    updatedAt: string
  }>>('banners')
  if (!banners || banners.length === 0) return

  console.log(`📥 Importing ${banners.length} banners...`)
  for (const banner of banners) {
    try {
      await prisma.banner.upsert({
        where: { id: banner.id },
        update: {
          title: banner.title,
          subtitle: banner.subtitle,
          description: banner.description,
          image: banner.image,
          detailsImage: banner.detailsImage,
          ctaText: banner.ctaText,
          order: banner.order ?? 0,
          isActive: banner.isActive ?? true,
        },
        create: {
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          description: banner.description,
          image: banner.image,
          detailsImage: banner.detailsImage,
          ctaText: banner.ctaText,
          order: banner.order ?? 0,
          isActive: banner.isActive ?? true,
          createdAt: new Date(banner.createdAt),
          updatedAt: new Date(banner.updatedAt),
        },
      })
    } catch (error: any) {
      console.error(`Failed to import banner ${banner.id}:`, error.message)
    }
  }
  console.log('✅ Banners imported')
}

async function seedProducts() {
  const products = await readJsonFile<Array<{
    id: string
    title: string
    description: string
    price: number
    images?: string[]
    sku?: string
    article?: string
    isActive?: boolean
    createdAt: string
    updatedAt: string
  }>>('products')
  if (!products || products.length === 0) return

  console.log(`📥 Importing ${products.length} products...`)
  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          title: product.title,
          description: product.description,
          price: product.price,
          images: product.images || [],
          sku: product.sku,
          article: product.article,
          isActive: product.isActive ?? true,
        },
        create: {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          images: product.images || [],
          sku: product.sku,
          article: product.article,
          isActive: product.isActive ?? true,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
        },
      })
    } catch (error: any) {
      console.error(`Failed to import product ${product.id}:`, error.message)
    }
  }
  console.log('✅ Products imported')
}

async function seedPromos() {
  const promos = await readJsonFile<Array<{
    id: string
    code: string
    type: 'percent' | 'fixed'
    value: number
    active?: boolean
    createdAt: string
  }>>('promos')
  if (!promos || promos.length === 0) return

  console.log(`📥 Importing ${promos.length} promos...`)
  for (const promo of promos) {
    try {
      // Convert old promo format to new format
      const discountPercent = promo.type === 'percent' ? promo.value : 0
      
      await prisma.promo.upsert({
        where: { code: promo.code.toUpperCase() },
        update: {
          discountPercent,
          isActive: promo.active ?? true,
        },
        create: {
          id: promo.id,
          code: promo.code.toUpperCase(),
          discountPercent,
          isActive: promo.active ?? true,
          createdAt: new Date(promo.createdAt),
        },
      })
    } catch (error: any) {
      console.error(`Failed to import promo ${promo.code}:`, error.message)
    }
  }
  console.log('✅ Promos imported')
}

async function seedCategories() {
  const defaultCategories = [
    { name: 'Худи', slug: 'hoodie', order: 1 },
    { name: 'Футболки', slug: 'tshirt', order: 2 },
    { name: 'Брюки', slug: 'pants', order: 3 },
    { name: 'Аксессуары', slug: 'accessories', order: 4 },
    { name: 'Головные уборы', slug: 'headwear', order: 5 },
    { name: 'Кастом', slug: 'custom', order: 6 },
  ]

  console.log('📥 Seeding default categories...')
  for (const cat of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          order: cat.order,
          isActive: true,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          isActive: true,
        },
      })
    } catch (error: any) {
      console.error(`Failed to seed category ${cat.slug}:`, error.message)
    }
  }
  console.log('✅ Categories seeded')
}

async function seedSettings() {
  const settings = await readJsonFile<any>('settings')
  if (!settings) return

  console.log('📥 Importing settings...')
  try {
    await prisma.setting.upsert({
      where: { key: 'main' },
      update: { value: settings },
      create: {
        key: 'main',
        value: settings,
      },
    })
    console.log('✅ Settings imported')
  } catch (error: any) {
    console.error('Failed to import settings:', error.message)
  }
}

async function main() {
  console.log('🚀 Starting data migration from JSON to PostgreSQL...\n')
  
  try {
    await seedAdmins()
    await seedBanners()
    await seedCategories()
    await seedProducts()
    await seedPromos()
    await seedSettings()
    
    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


