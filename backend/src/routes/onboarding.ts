import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'
import { optionalPhone, optionalText } from '../lib/validation'

type OnboardingPayload = {
  step?: number
  firstName?: string
  lastName?: string
  phone?: string
  departmentId?: string | null
  municipalityId?: string | null
  professionalAreaId?: string | null
  specializationId?: string | null
  companyName?: string
  description?: string
  website?: string
  economicSectorId?: string | null
  address?: string
  contactEmail?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function optionalCatalogId(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error(`${label} no es vÃ¡lido.`)
  return value
}

function hasLegacyCompleteProfile(
  role: string,
  candidateProfile: { firstName: string; lastName: string } | null,
  companyProfile: { name: string } | null,
): boolean {
  if (role === 'CANDIDATE') return Boolean(candidateProfile?.firstName.trim() && candidateProfile.lastName.trim())
  if (role === 'COMPANY') return Boolean(companyProfile?.name.trim())
  return false
}

export async function registerOnboardingRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/onboarding', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request, db)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesiÃ³n para continuar.' })

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true,
        onboardingStep: true,
        candidateProfile: {
          select: {
            id: true, firstName: true, lastName: true, phone: true, departmentId: true,
            municipalityId: true, professionalAreaId: true, specializationId: true,
          },
        },
        companyProfile: {
          select: {
            id: true, name: true, description: true, website: true, economicSectorId: true,
            departmentId: true, municipalityId: true, address: true, contactEmail: true, phone: true,
          },
        },
      },
    })
    if (!user || !['CANDIDATE', 'COMPANY'].includes(user.role)) {
      return reply.code(403).send({ message: 'Esta cuenta no puede completar este perfil.' })
    }

    const profile = user.role === 'CANDIDATE' ? user.candidateProfile : user.companyProfile
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role, user.candidateProfile, user.companyProfile,
    )
    const complete = Boolean(profile) && (user.onboardingStep === 4 || legacyComplete)
    const currentStep = complete ? 4 : user.onboardingStep === 4 ? 1 : user.onboardingStep ?? 1
    const catalogs = user.role === 'CANDIDATE'
      ? await Promise.all([
          db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
          db.professionalArea.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          db.specialization.findMany({ where: { isActive: true }, select: { id: true, name: true, professionalAreaId: true }, orderBy: { name: 'asc' } }),
        ]).then(([departments, municipalities, professionalAreas, specializations]) => ({
          departments, municipalities, professionalAreas, specializations,
        }))
      : await Promise.all([
          db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
          db.municipality.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: 'asc' } }),
          db.economicSector.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        ]).then(([departments, municipalities, economicSectors]) => ({ departments, municipalities, economicSectors }))

    return {
      role: user.role,
      step: Math.min(currentStep, 3),
      complete,
      profile,
      catalogs,
    }
  })

  app.post('/api/onboarding/step', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request, db)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesiÃ³n para continuar.' })

    const body = (request.body ?? {}) as OnboardingPayload
    const step = body.step
    if (step !== 1 && step !== 2 && step !== 3) {
      return reply.code(400).send({ message: 'El paso indicado no es vÃ¡lido.' })
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true, onboardingStep: true,
        candidateProfile: { select: { id: true, firstName: true, lastName: true, departmentId: true, municipalityId: true, professionalAreaId: true } },
        companyProfile: { select: { id: true, name: true, departmentId: true, municipalityId: true } },
      },
    })
    if (!user || !['CANDIDATE', 'COMPANY'].includes(user.role)) {
      return reply.code(403).send({ message: 'Esta cuenta no puede completar este perfil.' })
    }

    const existingProfile = user.role === 'CANDIDATE' ? user.candidateProfile : user.companyProfile
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role,
      user.candidateProfile ? { firstName: user.candidateProfile.firstName, lastName: user.candidateProfile.lastName } : null,
      user.companyProfile ? { name: user.companyProfile.name } : null,
    )
    const currentStep = legacyComplete ? 4 : user.onboardingStep === 4 && !existingProfile ? 1 : user.onboardingStep ?? 1
    if (currentStep === 4) return reply.code(409).send({ message: 'Este perfil ya estÃ¡ completo.' })
    if (step > currentStep) return reply.code(409).send({ message: 'Completa el paso actual antes de continuar.' })

    try {
      if (user.role === 'CANDIDATE') {
        const old = user.candidateProfile
        let profileId = old?.id

        if (step === 1) {
          const firstName = optionalText(body.firstName, 100, 'El nombre') ?? old?.firstName
          const lastName = optionalText(body.lastName, 100, 'Los apellidos') ?? old?.lastName
          if (!firstName || !lastName) return reply.code(400).send({ message: 'Ingresa tu nombre y apellidos para continuar.' })
          const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
          const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
          const mergedDepartmentId = departmentId === undefined ? old?.departmentId : departmentId
          const mergedMunicipalityId = municipalityId === undefined ? old?.municipalityId : municipalityId
          if (mergedDepartmentId && !await db.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un departamento vÃ¡lido.' })
          }
          if (mergedMunicipalityId) {
            const municipality = await db.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
            if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
              return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
            }
          }
          const phone = optionalPhone(body.phone)
          const profile = await db.$transaction(async (tx) => {
            const saved = await tx.candidateProfile.upsert({
              where: { userId: sessionUser.id },
              create: {
                userId: sessionUser.id, firstName, lastName,
                ...(phone ? { phone } : {}),
                ...(mergedDepartmentId ? { departmentId: mergedDepartmentId } : {}),
                ...(mergedMunicipalityId ? { municipalityId: mergedMunicipalityId } : {}),
              },
              update: {
                firstName, lastName,
                ...(phone ? { phone } : {}),
                ...(departmentId !== undefined ? { departmentId: departmentId ?? null } : {}),
                ...(municipalityId !== undefined ? { municipalityId: municipalityId ?? null } : {}),
              },
              select: { id: true },
            })
            await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 2) } })
            return saved
          })
          profileId = profile.id
        } else if (step === 2) {
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu informaciÃ³n personal.' })
          const professionalAreaId = optionalCatalogId(body.professionalAreaId, 'El Ã¡rea profesional')
          const specializationId = optionalCatalogId(body.specializationId, 'La especializaciÃ³n')
          const mergedAreaId = professionalAreaId === undefined ? old.professionalAreaId : professionalAreaId
          if (mergedAreaId && !await db.professionalArea.findFirst({ where: { id: mergedAreaId, isActive: true }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un Ã¡rea profesional vÃ¡lida.' })
          }
          if (specializationId) {
            const specialization = await db.specialization.findFirst({ where: { id: specializationId, isActive: true }, select: { professionalAreaId: true } })
            if (!specialization || !mergedAreaId || specialization.professionalAreaId !== mergedAreaId) {
              return reply.code(400).send({ message: 'La especializaciÃ³n debe corresponder al Ã¡rea seleccionada.' })
            }
          }
          await db.$transaction(async (tx) => {
            await tx.candidateProfile.update({
              where: { userId: sessionUser.id },
              data: {
                ...(professionalAreaId !== undefined ? { professionalAreaId } : {}),
                ...(specializationId !== undefined ? { specializationId } : {}),
              },
            })
            await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 3) } })
          })
          profileId = old.id
        } else {
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu informaciÃ³n personal.' })
          await db.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
          profileId = old.id
        }
        return { ok: true, step: step === 3 ? 4 : Math.max(currentStep, step + 1), profileId }
      }

      const old = user.companyProfile
      let profileId = old?.id
      if (step === 1) {
        const name = optionalText(body.companyName, 160, 'El nombre de la empresa') ?? old?.name
        if (!name) return reply.code(400).send({ message: 'Ingresa el nombre de la empresa para continuar.' })
        const economicSectorId = optionalCatalogId(body.economicSectorId, 'El sector econÃ³mico')
        if (economicSectorId && !await db.economicSector.findFirst({ where: { id: economicSectorId, isActive: true }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un sector vÃ¡lido.' })
        }
        const description = optionalText(body.description, 5000, 'La descripciÃ³n')
        const website = optionalText(body.website, 2000, 'El sitio web')
        if (website) {
          try {
            const parsed = new URL(website)
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
          } catch {
            return reply.code(400).send({ message: 'Ingresa una direcciÃ³n web vÃ¡lida.' })
          }
        }
        const saved = await db.$transaction(async (tx) => {
          const profile = await tx.companyProfile.upsert({
            where: { ownerUserId: sessionUser.id },
            create: {
              ownerUserId: sessionUser.id, name,
              ...(description ? { description } : {}),
              ...(website ? { website } : {}),
              ...(economicSectorId ? { economicSectorId } : {}),
            },
            update: {
              name,
              ...(description ? { description } : {}),
              ...(website ? { website } : {}),
              ...(economicSectorId !== undefined ? { economicSectorId } : {}),
            },
            select: { id: true },
          })
          await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 2) } })
          return profile
        })
        profileId = saved.id
      } else if (step === 2) {
        if (!old) return reply.code(409).send({ message: 'Guarda primero la informaciÃ³n bÃ¡sica de la empresa.' })
        const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
        const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
        const mergedDepartmentId = departmentId === undefined ? old.departmentId : departmentId
        const mergedMunicipalityId = municipalityId === undefined ? old.municipalityId : municipalityId
        if (mergedDepartmentId && !await db.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un departamento vÃ¡lido.' })
        }
        if (mergedMunicipalityId) {
          const municipality = await db.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
          if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
            return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
          }
        }
        const contactEmail = optionalText(body.contactEmail, 254, 'El correo de contacto')
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
          return reply.code(400).send({ message: 'Ingresa un correo de contacto vÃ¡lido.' })
        }
        const phone = optionalPhone(body.phone)
        const address = optionalText(body.address, 500, 'La direcciÃ³n')
        await db.$transaction(async (tx) => {
          await tx.companyProfile.update({
            where: { ownerUserId: sessionUser.id },
            data: {
              ...(departmentId !== undefined ? { departmentId } : {}),
              ...(municipalityId !== undefined ? { municipalityId } : {}),
              ...(address ? { address } : {}), ...(contactEmail ? { contactEmail } : {}),
              ...(phone ? { phone } : {}),
            },
          })
          await tx.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: Math.max(currentStep, 3) } })
        })
        profileId = old.id
      } else {
        if (!old) return reply.code(409).send({ message: 'Guarda primero la informaciÃ³n bÃ¡sica de la empresa.' })
        await db.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
        profileId = old.id
      }
      return { ok: true, step: step === 3 ? 4 : Math.max(currentStep, step + 1), profileId }
    } catch (error) {
      if (error instanceof Error && /no es vÃ¡lido/.test(error.message)) {
        return reply.code(400).send({ message: error.message })
      }
      request.log.error(error)
      return reply.code(500).send({ message: 'No se pudieron guardar los cambios. IntÃ©ntalo de nuevo.' })
    }
  })
}
