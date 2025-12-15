import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Получаем __dirname эквивалент для ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Путь к data директории относительно файла jsonDb.ts
const DATA_DIR = join(__dirname, '../../data')

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error: any) {
    throw new Error(`Failed to create data directory: ${error.message}`)
  }
}

export async function readJson<T = any>(name: string, fallback?: T): Promise<T> {
  await ensureDataDir()
  const filePath = join(DATA_DIR, `${name}.json`)
  
  // Проверяем существование файла
  try {
    await fs.access(filePath)
  } catch {
    // Файл не существует → возвращаем fallback
    if (fallback !== undefined) {
      return fallback
    }
    return null as T
  }

  // Читаем файл
  let data: string
  try {
    data = await fs.readFile(filePath, 'utf-8')
  } catch (error: any) {
    console.error('[jsonDb]', name, 'read error:', error.message)
    // Возвращаем fallback вместо ошибки
    return (fallback !== undefined ? fallback : null) as T
  }

  // Проверяем, что файл не пустой
  if (!data || data.trim().length === 0) {
    console.error('[jsonDb]', name, 'file is empty, using fallback')
    return (fallback !== undefined ? fallback : null) as T
  }

  // Парсим JSON
  try {
    return JSON.parse(data) as T
  } catch (parseError: any) {
    // Если JSON битый → лог + возвращаем fallback (НЕ 500)
    console.error('[jsonDb]', name, 'invalid JSON:', parseError.message)
    return (fallback !== undefined ? fallback : null) as T
  }
}

export async function writeJson<T = any>(name: string, data: T): Promise<void> {
  // Создаём директорию если нет
  await ensureDataDir()
  
  const filePath = join(DATA_DIR, `${name}.json`)
  const tempPath = `${filePath}.tmp`
  
  // Сериализуем данные
  let jsonString: string
  try {
    jsonString = JSON.stringify(data, null, 2)
  } catch (error: any) {
    throw new Error(`Failed to serialize data for ${name}: ${error.message}`)
  }
  
  // Записываем во временный файл (атомарная запись)
  try {
    await fs.writeFile(tempPath, jsonString, 'utf-8')
  } catch (error: any) {
    console.error('[jsonDb]', name, 'write error:', error.message)
    throw new Error(`Failed to write temp file ${tempPath}: ${error.message}`)
  }
  
  // Атомарное переименование
  try {
    await fs.rename(tempPath, filePath)
  } catch (error: any) {
    // Пытаемся удалить временный файл при ошибке
    try {
      await fs.unlink(tempPath)
    } catch {
      // Игнорируем ошибку удаления
    }
    console.error('[jsonDb]', name, 'rename error:', error.message)
    throw new Error(`Failed to rename temp file to ${filePath}: ${error.message}`)
  }
}

