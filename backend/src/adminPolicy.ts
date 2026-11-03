export function canManageUserRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'ADMIN' && targetRole === 'ADMIN') return false
  if (targetRole === 'SUPERADMIN' && actorRole !== 'SUPERADMIN') return false
  return true
}
