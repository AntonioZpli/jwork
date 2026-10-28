import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { LanguageLevel } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { normalizeNicaraguaPhone, optionalPhone } from '../lib/validation'
import { resolveSessionUser } from '../lib/auth'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LANGUAGE_LEVELS = Object.values(LanguageLevel)

class ProfileInputError extends Error {}
function text(value: unknown, label: string, max: number, required = false): string | null {
  if (value === undefined) return null
  if (value === null || value === '') { if (required) throw new ProfileInputError(`${label} es obligatorio.`); return null }
  if (typeof value !== 'string') throw new ProfileInputError(`${label} no es válido.`)
  const clean = value.trim()
  if ((!clean && required) || clean.length > max) throw new ProfileInputError(`${label} no es válido.`)
  return clean || null
}
function id(value: unknown, label: string, required = false): string | null {
  if (value === undefined || value === null || value === '') { if (required) throw new ProfileInputError(`${label} es obligatorio.`); return null }
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new ProfileInputError(`${label} no es válido.`)
  return value
}
function date(value: unknown, label: string, required = false): Date | null {
  if (value === undefined || value === null || value === '') { if (required) throw new ProfileInputError(`${label} es obligatorio.`); return null }
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`)
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ProfileInputError(`${label} no es válido.`)
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ProfileInputError(`${label} no es válido.`)
  return parsed
}
function objectBody(value: unknown, fields: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProfileInputError('Los datos enviados no son válidos.')
  const body = value as Record<string, unknown>
  if (Object.keys(body).some(key => !fields.includes(key))) throw new ProfileInputError('La solicitud contiene campos no permitidos.')
  return body
}
async function requireRole(request: FastifyRequest, reply: FastifyReply, db: typeof prisma, role: 'CANDIDATE' | 'COMPANY') {
  const user = await resolveSessionUser(request, db)
  if (!user) { reply.code(401).send({ message: 'Inicia sesión para continuar.' }); return null }
  if (user.role !== role) { reply.code(403).send({ message: 'Esta operación no corresponde a tu tipo de cuenta.' }); return null }
  return user
}
async function validateLocation(db: typeof prisma, departmentId: string | null, municipalityId: string | null) {
  if (departmentId && !await db.department.findUnique({ where: { id: departmentId }, select: { id: true } })) throw new ProfileInputError('Selecciona un departamento válido.')
  if (municipalityId) {
    const municipality = await db.municipality.findUnique({ where: { id: municipalityId }, select: { departmentId: true } })
    if (!municipality || municipality.departmentId !== departmentId) throw new ProfileInputError('El municipio debe pertenecer al departamento seleccionado.')
  }
}
function candidatePhone(value: unknown) {
  try { return normalizeNicaraguaPhone(value) }
  catch (error) { throw new ProfileInputError(error instanceof Error ? error.message : 'El teléfono no es válido.') }
}
function companyPhone(value: unknown) {
  try { return optionalPhone(value) ?? null }
  catch (error) { throw new ProfileInputError(error instanceof Error ? error.message : 'El teléfono no es válido.') }
}

async function candidateProfileId(request: FastifyRequest, reply: FastifyReply, db: typeof prisma) {
  const user = await requireRole(request, reply, db, 'CANDIDATE')
  if (!user) return null
  const profile = await db.candidateProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!profile) { reply.code(404).send({ message: 'Completa primero tu perfil de candidato.' }); return null }
  return { user, profileId: profile.id }
}

function parseExperience(value: unknown, current?: Record<string, unknown>) {
  const body = objectBody(value, ['position', 'company', 'startDate', 'endDate', 'description'])
  const source = { ...(current ?? {}), ...body }
  const position = text(source.position, 'El puesto', 160, true)!
  const company = text(source.company, 'La empresa', 160, true)!
  const startDate = date(source.startDate, 'La fecha de inicio', true)!
  const endDate = date(source.endDate, 'La fecha de fin')
  if (startDate > new Date()) throw new ProfileInputError('La fecha de inicio no puede estar en el futuro.')
  if (endDate && endDate < startDate) throw new ProfileInputError('La fecha de fin no puede ser anterior al inicio.')
  return { position, company, startDate, endDate, description: text(source.description, 'La descripción', 5000) }
}

function parseEducation(value: unknown, current?: Record<string, unknown>) {
  const body = objectBody(value, ['institution', 'degree', 'startDate', 'endDate'])
  const source = { ...(current ?? {}), ...body }
  const institution = text(source.institution, 'La institución', 200, true)!
  const degree = text(source.degree, 'El título', 200, true)!
  const startDate = date(source.startDate, 'La fecha de inicio')
  const endDate = date(source.endDate, 'La fecha de fin')
  if (startDate && endDate && endDate < startDate) throw new ProfileInputError('La fecha de fin no puede ser anterior al inicio.')
  return { institution, degree, startDate, endDate }
}

export async function registerProfileRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/candidate/profile', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db)
    if (!context) return
    const [profile, catalogs] = await Promise.all([
      db.candidateProfile.findUnique({ where: { id: context.profileId }, select: {
        firstName: true, lastName: true, contactEmail: true, phone: true, photoUrl: true, cvUrl: true, description: true,
        departmentId: true, municipalityId: true, professionalAreaId: true, specializationId: true,
        department: { select: { name: true } }, municipality: { select: { name: true } },
        experiences: { orderBy: { startDate: 'desc' }, select: { id: true, position: true, company: true, startDate: true, endDate: true, description: true } },
        education: { orderBy: { endDate: 'desc' }, select: { id: true, institution: true, degree: true, startDate: true, endDate: true } },
        languages: { select: { level: true, language: { select: { id: true, name: true } } } },
      } }),
      Promise.all([
        db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
        db.professionalArea.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.specialization.findMany({ where: { isActive: true }, select: { id: true, name: true, professionalAreaId: true }, orderBy: { name: 'asc' } }),
        db.language.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      ]),
    ])
    return { profile, catalogs: { departments: catalogs[0], municipalities: catalogs[1], professionalAreas: catalogs[2], specializations: catalogs[3], languages: catalogs[4] } }
  })

  app.patch('/api/candidate/profile', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db)
    if (!context) return
    const existing = await db.candidateProfile.findUnique({ where: { id: context.profileId } })
    if (!existing) return reply.code(404).send({ message: 'No se encontró el perfil.' })
    try {
      const body = objectBody(request.body, ['firstName', 'lastName', 'contactEmail', 'phone', 'departmentId', 'municipalityId', 'professionalAreaId', 'specializationId', 'description'])
      const firstName = body.firstName === undefined ? existing.firstName : text(body.firstName, 'El nombre', 100, true)!
      const lastName = body.lastName === undefined ? existing.lastName : text(body.lastName, 'Los apellidos', 100, true)!
      const contactEmail = body.contactEmail === undefined ? existing.contactEmail : text(body.contactEmail, 'El correo de contacto', 254)
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new ProfileInputError('El correo de contacto no es válido.')
      const phone = body.phone === undefined ? existing.phone : body.phone === null || body.phone === '' ? null : candidatePhone(body.phone)
      const departmentId = body.departmentId === undefined ? existing.departmentId : id(body.departmentId, 'El departamento')
      const municipalityId = body.municipalityId === undefined ? existing.municipalityId : id(body.municipalityId, 'El municipio')
      await validateLocation(db, departmentId, municipalityId)
      const professionalAreaId = body.professionalAreaId === undefined ? existing.professionalAreaId : id(body.professionalAreaId, 'El área profesional')
      const specializationId = body.specializationId === undefined ? existing.specializationId : id(body.specializationId, 'La especialidad')
      if (professionalAreaId && !await db.professionalArea.findFirst({ where: { id: professionalAreaId, isActive: true }, select: { id: true } })) throw new ProfileInputError('Selecciona un área profesional activa.')
      if (specializationId && !await db.specialization.findFirst({ where: { id: specializationId, professionalAreaId: professionalAreaId ?? '', isActive: true }, select: { id: true } })) throw new ProfileInputError('La especialidad debe pertenecer al área profesional seleccionada.')
      const description = body.description === undefined ? existing.description : text(body.description, 'La descripción', 5000)
      const profile = await db.candidateProfile.update({ where: { id: context.profileId }, data: { firstName, lastName, contactEmail, phone, departmentId, municipalityId, professionalAreaId, specializationId, description }, select: { id: true, firstName: true, lastName: true, contactEmail: true, phone: true, departmentId: true, municipalityId: true, professionalAreaId: true, specializationId: true, description: true } })
      return { profile }
    } catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })

  app.post('/api/candidate/profile/experiences', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    try { const data = parseExperience(request.body); const experience = await db.experience.create({ data: { ...data, candidateProfileId: context.profileId }, select: { id: true, position: true, company: true, startDate: true, endDate: true, description: true } }); return reply.code(201).send({ experience }) }
    catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
  app.patch('/api/candidate/profile/experiences/:id', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    const { id: experienceId } = request.params as { id: string }
    if (!UUID_PATTERN.test(experienceId)) return reply.code(400).send({ message: 'El identificador de experiencia no es válido.' })
    const current = await db.experience.findFirst({ where: { id: experienceId, candidateProfileId: context.profileId } })
    if (!current) return reply.code(404).send({ message: 'No se encontró la experiencia.' })
    try { const data = parseExperience(request.body, current as unknown as Record<string, unknown>); const experience = await db.experience.update({ where: { id: experienceId }, data, select: { id: true, position: true, company: true, startDate: true, endDate: true, description: true } }); return { experience } }
    catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
  app.delete('/api/candidate/profile/experiences/:id', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    const { id: experienceId } = request.params as { id: string }
    if (!UUID_PATTERN.test(experienceId)) return reply.code(400).send({ message: 'El identificador de experiencia no es válido.' })
    const deleted = await db.experience.deleteMany({ where: { id: experienceId, candidateProfileId: context.profileId } })
    if (!deleted.count) return reply.code(404).send({ message: 'No se encontró la experiencia.' })
    return { ok: true }
  })

  app.post('/api/candidate/profile/education', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    try { const data = parseEducation(request.body); const education = await db.education.create({ data: { ...data, candidateProfileId: context.profileId }, select: { id: true, institution: true, degree: true, startDate: true, endDate: true } }); return reply.code(201).send({ education }) }
    catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
  app.patch('/api/candidate/profile/education/:id', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    const { id: educationId } = request.params as { id: string }
    if (!UUID_PATTERN.test(educationId)) return reply.code(400).send({ message: 'El identificador de formación no es válido.' })
    const current = await db.education.findFirst({ where: { id: educationId, candidateProfileId: context.profileId } })
    if (!current) return reply.code(404).send({ message: 'No se encontró la formación.' })
    try { const data = parseEducation(request.body, current as unknown as Record<string, unknown>); const education = await db.education.update({ where: { id: educationId }, data, select: { id: true, institution: true, degree: true, startDate: true, endDate: true } }); return { education } }
    catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
  app.delete('/api/candidate/profile/education/:id', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    const { id: educationId } = request.params as { id: string }
    if (!UUID_PATTERN.test(educationId)) return reply.code(400).send({ message: 'El identificador de formación no es válido.' })
    const deleted = await db.education.deleteMany({ where: { id: educationId, candidateProfileId: context.profileId } })
    if (!deleted.count) return reply.code(404).send({ message: 'No se encontró la formación.' })
    return { ok: true }
  })

  app.post('/api/candidate/profile/languages', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    try {
      const body = objectBody(request.body, ['languageId', 'level'])
      const languageId = id(body.languageId, 'El idioma', true)!
      if (typeof body.level !== 'string' || !LANGUAGE_LEVELS.includes(body.level as typeof LANGUAGE_LEVELS[number])) throw new ProfileInputError('El nivel de idioma no es válido.')
      if (!await db.language.findUnique({ where: { id: languageId }, select: { id: true } })) throw new ProfileInputError('Selecciona un idioma válido.')
      const language = await db.candidateLanguage.upsert({ where: { candidateProfileId_languageId: { candidateProfileId: context.profileId, languageId } }, create: { candidateProfileId: context.profileId, languageId, level: body.level as typeof LanguageLevel[keyof typeof LanguageLevel] }, update: { level: body.level as typeof LanguageLevel[keyof typeof LanguageLevel] }, select: { level: true, language: { select: { id: true, name: true } } } })
      return { language }
    } catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
  app.delete('/api/candidate/profile/languages/:languageId', async (request, reply) => {
    const context = await candidateProfileId(request, reply, db); if (!context) return
    const { languageId } = request.params as { languageId: string }
    if (!UUID_PATTERN.test(languageId)) return reply.code(400).send({ message: 'El identificador de idioma no es válido.' })
    const deleted = await db.candidateLanguage.deleteMany({ where: { candidateProfileId: context.profileId, languageId } })
    if (!deleted.count) return reply.code(404).send({ message: 'No se encontró el idioma en tu perfil.' })
    return { ok: true }
  })

  app.get('/api/company/profile', async (request, reply) => {
    const user = await requireRole(request, reply, db, 'COMPANY'); if (!user) return
    const [profile, departments, municipalities, economicSectors] = await Promise.all([
      db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true, name: true, description: true, website: true, economicSectorId: true, departmentId: true, municipalityId: true, address: true, contactEmail: true, phone: true, taxId: true, verificationStatus: true } }),
      db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
      db.economicSector.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    if (!profile) return reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })
    return { profile, catalogs: { departments, municipalities, economicSectors } }
  })
  app.patch('/api/company/profile', async (request, reply) => {
    const user = await requireRole(request, reply, db, 'COMPANY'); if (!user) return
    const existing = await db.companyProfile.findUnique({ where: { ownerUserId: user.id }, select: { id: true, name: true, description: true, website: true, economicSectorId: true, departmentId: true, municipalityId: true, address: true, contactEmail: true, phone: true, taxId: true } })
    if (!existing) return reply.code(404).send({ message: 'Completa primero el perfil de tu empresa.' })
    try {
      const body = objectBody(request.body, ['name', 'description', 'website', 'economicSectorId', 'departmentId', 'municipalityId', 'address', 'contactEmail', 'phone', 'taxId'])
      const name = body.name === undefined ? existing.name : text(body.name, 'El nombre de empresa', 160, true)!
      const description = body.description === undefined ? existing.description : text(body.description, 'La descripción', 5000)
      const website = body.website === undefined ? existing.website : text(body.website, 'El sitio web', 2000)
      if (website) { try { const parsed = new URL(website); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error() } catch { throw new ProfileInputError('El sitio web debe ser una dirección http o https válida.') } }
      const economicSectorId = body.economicSectorId === undefined ? existing.economicSectorId : id(body.economicSectorId, 'El sector económico')
      if (economicSectorId && !await db.economicSector.findFirst({ where: { id: economicSectorId, isActive: true }, select: { id: true } })) throw new ProfileInputError('Selecciona un sector económico activo.')
      const departmentId = body.departmentId === undefined ? existing.departmentId : id(body.departmentId, 'El departamento')
      const municipalityId = body.municipalityId === undefined ? existing.municipalityId : id(body.municipalityId, 'El municipio')
      await validateLocation(db, departmentId, municipalityId)
      const address = body.address === undefined ? existing.address : text(body.address, 'La dirección', 500)
      const contactEmail = body.contactEmail === undefined ? existing.contactEmail : text(body.contactEmail, 'El correo de contacto', 254)
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new ProfileInputError('El correo de contacto no es válido.')
      const phone = body.phone === undefined ? existing.phone : companyPhone(body.phone)
      const taxId = body.taxId === undefined ? existing.taxId : text(body.taxId, 'La identificación fiscal', 80)
      const profile = await db.companyProfile.update({ where: { id: existing.id }, data: { name, description, website, economicSectorId, departmentId, municipalityId, address, contactEmail, phone, taxId }, select: { id: true, name: true, description: true, website: true, economicSectorId: true, departmentId: true, municipalityId: true, address: true, contactEmail: true, phone: true, taxId: true, verificationStatus: true } })
      return { profile }
    } catch (error) { if (error instanceof ProfileInputError) return reply.code(400).send({ message: error.message }); throw error }
  })
}
