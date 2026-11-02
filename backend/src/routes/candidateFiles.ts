import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FastifyInstance } from 'fastify'
import { config } from '../config'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'

const MAX_CV_BYTES = 5 * 1024 * 1024
const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const MAX_LOGO_BYTES = 2 * 1024 * 1024
type FileKind = 'cv' | 'photo' | 'logo'

function kindValue(value: string): FileKind | null { return value === 'cv' || value === 'photo' || value === 'logo' ? value : null }
function extension(kind: FileKind, mime?: string) {
  if (kind === 'cv') return '.pdf'
  return mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.webp'
}
function safeCvFileName(value: string) {
  let decoded = value
  try { decoded = decodeURIComponent(value) } catch { /* Use the raw value when the header is malformed. */ }
  const baseName = decoded.replace(/\\/g, '/').split('/').pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 175) ?? ''
  const nameWithoutExtension = baseName.replace(/\.pdf$/i, '').trim()
  return `${nameWithoutExtension || 'curriculum'}.pdf`
}
function safeName(value: string, kind: FileKind) {
  const ext = kind === 'cv' ? '\\.pdf' : '\\.(?:jpg|png|webp)'
  return new RegExp(`^[0-9a-f-]{36}${ext}$`, 'i').test(value)
}
function isAllowedFile(kind: FileKind, mime: string, file: Buffer) {
  if (kind === 'cv') return mime === 'application/pdf' && file.subarray(0, 5).toString() === '%PDF-'
  if (mime === 'image/jpeg') return file.length > 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff
  if (mime === 'image/png') return file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return mime === 'image/webp' && file.length > 12 && file.toString('ascii', 0, 4) === 'RIFF' && file.toString('ascii', 8, 12) === 'WEBP'
}
function isMissing(error: unknown) { return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT' }

export async function registerCandidateFileRoutes(app: FastifyInstance, db: typeof prisma) {
  app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_request, body, done) => done(null, body))

  app.put('/api/candidate/profile/files/:kind', { bodyLimit: MAX_CV_BYTES }, async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })
    if (user.role !== 'CANDIDATE') return reply.code(403).send({ message: 'Solo el candidato puede actualizar sus archivos.' })
    const { kind: rawKind } = request.params as { kind: string }
    const kind = kindValue(rawKind)
    if (!kind || kind === 'logo') return reply.code(404).send({ message: 'El tipo de archivo solicitado no existe.' })
    const mime = String(request.headers['x-upload-type'] ?? '').toLowerCase()
    const file = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0)
    const limit = kind === 'cv' ? MAX_CV_BYTES : MAX_PHOTO_BYTES
    if (!file.length || file.length > limit) return reply.code(413).send({ message: `El archivo debe pesar menos de ${kind === 'cv' ? '5' : '2'} MB.` })
    if (!isAllowedFile(kind, mime, file)) return reply.code(415).send({ message: kind === 'cv' ? 'El currículum debe ser un archivo PDF válido.' : 'La foto debe ser JPG, PNG o WebP válido.' })
    const profile = await db.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true, cvUrl: true, cvFileName: true, photoUrl: true } })
    if (!profile) return reply.code(404).send({ message: 'Completa primero tu perfil de candidato.' })
    const fileId = `${randomUUID()}${extension(kind, mime)}`
    const path = join(config.privateUploadDir, fileId)
    const field = kind === 'cv' ? 'cvUrl' : 'photoUrl'
    const previous = kind === 'cv' ? profile.cvUrl : profile.photoUrl
    const cvFileName = kind === 'cv' ? safeCvFileName(String(request.headers['x-upload-name'] ?? '')) : undefined
    await mkdir(config.privateUploadDir, { recursive: true, mode: 0o700 })
    await writeFile(path, file, { flag: 'wx', mode: 0o600 })
    try { await db.candidateProfile.update({ where: { id: profile.id }, data: { [field]: fileId, ...(cvFileName ? { cvFileName } : {}) } }) }
    catch (error) { await unlink(path).catch(() => undefined); throw error }
    if (previous && safeName(previous, kind)) await unlink(join(config.privateUploadDir, previous)).catch(() => undefined)
    return { fileId, kind }
  })

  app.get('/api/candidate/files/:kind/:fileId', async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })
    const { kind: rawKind, fileId } = request.params as { kind: string; fileId: string }
    const kind = kindValue(rawKind)
    if (!kind || kind === 'logo' || !safeName(fileId, kind)) return reply.code(404).send({ message: 'No se encontró el archivo.' })
    const profile = kind === 'cv'
      ? await db.candidateProfile.findFirst({ where: { cvUrl: fileId }, select: { id: true } })
      : await db.candidateProfile.findFirst({ where: { photoUrl: fileId }, select: { id: true } })
    if (!profile) return reply.code(404).send({ message: 'No se encontró el archivo.' })
    if (user.role === 'CANDIDATE') {
      const owner = await db.candidateProfile.findFirst({ where: { id: profile.id, userId: user.id }, select: { id: true } })
      if (!owner) return reply.code(404).send({ message: 'No se encontró el archivo.' })
    } else if (user.role === 'COMPANY') {
      const company = await db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true } })
      const relatedApplication = company && await db.application.findFirst({ where: { candidateProfileId: profile.id, job: { companyProfileId: company.id }, status: { not: 'WITHDRAWN' } }, select: { id: true } })
      if (!relatedApplication) return reply.code(404).send({ message: 'No se encontró el archivo.' })
    } else return reply.code(403).send({ message: 'No tienes acceso a este archivo.' })

    const path = join(config.privateUploadDir, fileId)
    try { await access(path) }
    catch (error) { if (isMissing(error)) return reply.code(404).send({ message: 'No se encontró el archivo.' }); throw error }
    const contentType = fileId.endsWith('.pdf') ? 'application/pdf' : fileId.endsWith('.jpg') ? 'image/jpeg' : fileId.endsWith('.png') ? 'image/png' : 'image/webp'
    return reply.type(contentType).header('Cache-Control', 'private, no-store').header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', kind === 'cv' ? 'attachment; filename="curriculum.pdf"' : 'inline; filename="profile-image"')
      .send(createReadStream(path))
  })

  app.put('/api/company/profile/logo', { bodyLimit: MAX_LOGO_BYTES }, async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesion para continuar.' })
    if (user.role !== 'COMPANY') return reply.code(403).send({ message: 'Solo una cuenta de empresa puede actualizar su logo.' })
    const mime = String(request.headers['x-upload-type'] ?? '').toLowerCase()
    const file = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0)
    if (!file.length || file.length > MAX_LOGO_BYTES) return reply.code(413).send({ message: 'El logo debe pesar como maximo 2 MB.' })
    if (!isAllowedFile('logo', mime, file)) return reply.code(415).send({ message: 'El logo debe ser una imagen JPG, PNG o WebP valida.' })
    const profile = await db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true, logoUrl: true } })
    if (!profile) return reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })
    const fileId = `${randomUUID()}${extension('logo', mime)}`
    const path = join(config.privateUploadDir, fileId)
    await mkdir(config.privateUploadDir, { recursive: true, mode: 0o700 })
    await writeFile(path, file, { flag: 'wx', mode: 0o600 })
    try { await db.companyProfile.update({ where: { id: profile.id }, data: { logoUrl: fileId } }) }
    catch (error) { await unlink(path).catch(() => undefined); throw error }
    if (profile.logoUrl && safeName(profile.logoUrl, 'logo')) await unlink(join(config.privateUploadDir, profile.logoUrl)).catch(() => undefined)
    return { fileId }
  })

  app.delete('/api/company/profile/logo', async (request, reply) => {
    const user = await resolveSessionUser(request, db)
    if (!user) return reply.code(401).send({ message: 'Inicia sesion para continuar.' })
    if (user.role !== 'COMPANY') return reply.code(403).send({ message: 'Solo una cuenta de empresa puede actualizar su logo.' })
    const profile = await db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true, logoUrl: true } })
    if (!profile) return reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })
    await db.companyProfile.update({ where: { id: profile.id }, data: { logoUrl: null } })
    if (profile.logoUrl && safeName(profile.logoUrl, 'logo')) await unlink(join(config.privateUploadDir, profile.logoUrl)).catch(() => undefined)
    return { ok: true }
  })

  // Company logos are public brand assets; uploaded content remains private on disk.
  app.get('/api/company/files/logo/:fileId', async (request, reply) => {
    const { fileId } = request.params as { fileId: string }
    if (!safeName(fileId, 'logo')) return reply.code(404).send({ message: 'No se encontro el logo.' })
    const company = await db.companyProfile.findFirst({ where: { logoUrl: fileId }, select: { id: true } })
    if (!company) return reply.code(404).send({ message: 'No se encontro el logo.' })
    const path = join(config.privateUploadDir, fileId)
    try { await access(path) }
    catch (error) { if (isMissing(error)) return reply.code(404).send({ message: 'No se encontro el logo.' }); throw error }
    const contentType = fileId.endsWith('.jpg') ? 'image/jpeg' : fileId.endsWith('.png') ? 'image/png' : 'image/webp'
    return reply.type(contentType).header('Cache-Control', 'public, max-age=31536000, immutable').header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', 'inline; filename="company-logo"').send(createReadStream(path))
  })
}
