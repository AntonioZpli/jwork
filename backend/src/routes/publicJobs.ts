import type { FastifyInstance } from 'fastify'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { buildPublicSalaryWhere, JobValidationError, parsePublicSalaryFilter } from './jobsValidation'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FILTERS = {
  workMode: ['ONSITE', 'HYBRID', 'REMOTE'],
  contractType: ['PERMANENT', 'TEMPORARY', 'CONTRACT', 'INTERNSHIP'],
  workday: ['FULL_TIME', 'PART_TIME'],
} as const

function queryText(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || value.length > maxLength) throw new JobValidationError(`${label} no es válido.`)
  const clean = value.trim()
  return clean || undefined
}

function queryId(value: unknown, label: string): string | undefined {
  const id = queryText(value, label, 36)
  if (id && !UUID_PATTERN.test(id)) throw new JobValidationError(`${label} no es válido.`)
  return id
}

function queryEnum<K extends keyof typeof FILTERS>(key: K, value: unknown): (typeof FILTERS)[K][number] | undefined {
  const entry = queryText(value, key, 32)
  if (!entry) return undefined
  if (!(FILTERS[key] as readonly string[]).includes(entry)) throw new JobValidationError(`El filtro ${key} no es válido.`)
  return entry as (typeof FILTERS)[K][number]
}

function publicJobSelect() {
  return {
    id: true, title: true, description: true, requirements: true,
    workMode: true, remoteScope: true, contractType: true, workday: true,
    scheduleType: true, scheduleDescription: true, salaryMin: true, salaryMax: true,
    salaryCurrency: true, salaryPeriod: true, salaryNegotiable: true,
    experienceYearsMin: true, isUrgent: true, vacancies: true, publishedAt: true, expiresAt: true,
    company: { select: {
      id: true, name: true, logoUrl: true, website: true, description: true, verificationStatus: true,
      economicSector: { select: { name: true } },
      department: { select: { name: true } },
      municipality: { select: { name: true } },
    } },
    professionalArea: { select: { id: true, name: true } },
    specialization: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },
    municipality: { select: { id: true, name: true } },
  }
}

export async function registerPublicJobRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/jobs/options', async () => {
    const [professionalAreas, specializations, departments, municipalities] = await Promise.all([
      db.professionalArea.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.specialization.findMany({ where: { isActive: true }, select: { id: true, name: true, professionalAreaId: true }, orderBy: { name: 'asc' } }),
      db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
    ])
    return { professionalAreas, specializations, departments, municipalities }
  })

  app.get('/api/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de empresa no es válido.' })
    const now = new Date()
    const company = await db.companyProfile.findFirst({
      where: { id, verificationStatus: 'VERIFIED', owner: { status: 'ACTIVE' } },
      select: {
        id: true, name: true, logoUrl: true, description: true, website: true, contactEmail: true, phone: true,
        economicSector: { select: { name: true } },
        department: { select: { name: true } }, municipality: { select: { name: true } },
        jobs: {
          where: { status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }],
          select: {
            id: true, title: true, workMode: true, contractType: true, publishedAt: true,
            professionalArea: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } }, municipality: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!company) return reply.code(404).send({ message: 'No se encontró el perfil público de esta empresa.' })
    return { company }
  })

  app.get('/api/jobs', async (request, reply) => {
    try {
      const query = request.query as Record<string, unknown>
      const q = queryText(query.q, 'La búsqueda', 100)
      const professionalAreaId = queryId(query.professionalAreaId, 'El área profesional')
      const specializationId = queryId(query.specializationId, 'La especialidad')
      const departmentId = queryId(query.departmentId, 'El departamento')
      const municipalityId = queryId(query.municipalityId, 'El municipio')
      const workMode = queryEnum('workMode', query.workMode)
      const contractType = queryEnum('contractType', query.contractType)
      const workday = queryEnum('workday', query.workday)
      const salaryWhere = buildPublicSalaryWhere(parsePublicSalaryFilter(query))
      const pageText = queryText(query.page, 'La página', 6)
      const page = pageText ? Number(pageText) : 1
      if (!Number.isInteger(page) || page < 1 || page > 10000) throw new JobValidationError('La página solicitada no es válida.')
      if (municipalityId && !departmentId) throw new JobValidationError('Selecciona también el departamento del municipio.')
      const now = new Date()
      const contains = q ? { contains: q, mode: 'insensitive' as const } : undefined
      const where: Prisma.JobWhereInput = {
        status: 'PUBLISHED',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        company: { verificationStatus: 'VERIFIED', owner: { status: 'ACTIVE' } },
        ...(q || salaryWhere ? { AND: [...(q ? [{ OR: [{ title: contains }, { description: contains }, { requirements: contains }, { company: { name: contains } }] }] : []), ...(salaryWhere ? [salaryWhere as Prisma.JobWhereInput] : [])] } : {}),
        ...(professionalAreaId ? { professionalAreaId } : {}),
        ...(specializationId ? { specializationId } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(municipalityId ? { municipalityId } : {}),
        ...(workMode ? { workMode } : {}),
        ...(contractType ? { contractType } : {}),
        ...(workday ? { workday } : {}),
      }
      const pageSize = 20
      const [total, jobs] = await Promise.all([
        db.job.count({ where }),
        db.job.findMany({ where, orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize, select: publicJobSelect() }),
      ])
      return { jobs, page, pageSize, total, pages: Math.ceil(total / pageSize) }
    } catch (error) {
      if (error instanceof JobValidationError) return reply.code(400).send({ message: error.message })
      throw error
    }
  })

  app.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!UUID_PATTERN.test(id)) return reply.code(400).send({ message: 'El identificador de vacante no es válido.' })
    const now = new Date()
    const job = await db.job.findFirst({
      where: {
        id, status: 'PUBLISHED', OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        company: { verificationStatus: 'VERIFIED', owner: { status: 'ACTIVE' } },
      },
      select: publicJobSelect(),
    })
    if (!job) return reply.code(404).send({ message: 'La vacante ya no está disponible.' })
    return { job }
  })
}
