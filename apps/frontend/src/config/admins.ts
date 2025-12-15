export const ADMIN_IDS = new Set<number>([
  930749603,
])

export const ROOT_ADMIN_ID = 930749603

export const isAdminId = (id?: number | null): boolean => {
  return typeof id === 'number' && ADMIN_IDS.has(id)
}

