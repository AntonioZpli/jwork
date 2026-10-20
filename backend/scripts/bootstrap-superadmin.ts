import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Uso: pnpm exec tsx scripts/bootstrap-superadmin.ts correo-existente')
  }
  const result = await prisma.$transaction(async tx => {
    const existing = await tx.user.count({ where: { role: 'SUPERADMIN' } })
    if (existing !== 0) throw new Error('Ya existe un SUPERADMIN; el bootstrap solo se permite una vez.')
    const target = await tx.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, status: true } })
    if (!target || target.role !== 'ADMIN' || target.status !== 'ACTIVE') throw new Error('El correo debe pertenecer a una cuenta ADMIN activa existente.')
    await tx.user.update({ where: { id: target.id }, data: { role: 'SUPERADMIN' } })
    await tx.auditLog.create({ data: { actorUserId: target.id, actionType: 'USER_ROLE_CHANGED', entityType: 'User', entityId: target.id, metadata: { previousRole: 'ADMIN', role: 'SUPERADMIN', method: 'one-time-bootstrap' } } })
    return { email: target.email, role: 'SUPERADMIN' }
  }, { isolationLevel: 'Serializable' })
  console.log(`Bootstrap complete: ${result.email} is ${result.role}.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Bootstrap failed.')
  process.exitCode = 1
}).finally(async () => prisma.$disconnect())
