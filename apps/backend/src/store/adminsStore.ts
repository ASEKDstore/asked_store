import { readJson, writeJson } from './jsonDb.js'

const ROOT_ADMIN_ID = 930749603

interface AdminsData {
  root: number
  admins: number[]
}

const DEFAULT_ADMINS_DATA: AdminsData = {
  root: ROOT_ADMIN_ID,
  admins: [ROOT_ADMIN_ID],
}

async function getAdminsData(): Promise<AdminsData> {
  try {
    const data = await readJson<AdminsData>('admins', DEFAULT_ADMINS_DATA)
    // Если readJson вернул fallback (null/undefined) или данные невалидны → используем дефолт
    if (!data || !data.admins || !Array.isArray(data.admins)) {
      return DEFAULT_ADMINS_DATA
    }
    // Ensure root is set
    if (!data.root) {
      data.root = ROOT_ADMIN_ID
      if (!data.admins.includes(ROOT_ADMIN_ID)) {
        data.admins.push(ROOT_ADMIN_ID)
      }
      await writeJson('admins', data)
    }
    return data
  } catch (error: any) {
    // Если произошла ошибка → возвращаем дефолт (НЕ throw)
    console.error('[adminsStore] getAdminsData error:', error.message)
    return DEFAULT_ADMINS_DATA
  }
}

export async function listAdmins(): Promise<number[]> {
  const data = await getAdminsData()
  return [...data.admins]
}

export async function isAdmin(tgId: number): Promise<boolean> {
  try {
    const data = await getAdminsData()
    return data.admins.includes(tgId)
  } catch (error: any) {
    // Если произошла ошибка → считаем "не админ" (НЕ throw)
    console.error('[adminsStore] isAdmin error:', error.message)
    return false
  }
}

export async function addAdmin(tgId: number): Promise<void> {
  if (typeof tgId !== 'number' || isNaN(tgId)) {
    throw new Error('Invalid tgId')
  }
  
  const data = await getAdminsData()
  
  // Don't add duplicates
  if (data.admins.includes(tgId)) {
    return
  }
  
  data.admins.push(tgId)
  await writeJson('admins', data)
}

export async function removeAdmin(tgId: number): Promise<void> {
  const data = await getAdminsData()
  
  // Cannot remove root
  if (tgId === data.root) {
    throw new Error('Cannot remove root admin')
  }
  
  const index = data.admins.indexOf(tgId)
  if (index === -1) {
    throw new Error('Admin not found')
  }
  
  data.admins.splice(index, 1)
  await writeJson('admins', data)
}

export { ROOT_ADMIN_ID }
