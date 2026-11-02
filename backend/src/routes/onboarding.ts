import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { resolveSessionUser } from '../lib/auth'
import { normalizeNicaraguaPhone, optionalPhone, optionalText } from '../lib/validation'

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
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error(`${label} no es válido.`)
  return value
}

function hasLegacyCompleteProfile(
  role: string,
  candidateProfile: { firstName: string; lastName: string; phone?: string | null; departmentId?: string | null; municipalityId?: string | null; professionalAreaId?: string | null } | null,
  companyProfile: { name: string } | null,
): boolean {
  if (role === 'CANDIDATE') return isCompleteCandidateProfile(candidateProfile)
  if (role === 'COMPANY') return Boolean(companyProfile?.name.trim())
  return false
}

function isCompleteCandidateProfile(profile: { firstName: string; lastName: string; phone?: string | null; departmentId?: string | null; municipalityId?: string | null; professionalAreaId?: string | null } | null): boolean {
  if (!profile || !profile.firstName.trim() || !profile.lastName.trim() || !profile.departmentId || !profile.municipalityId || !profile.professionalAreaId) return false
  try { normalizeNicaraguaPhone(profile.phone) } catch { return false }
  return true
}

function requiredPersonName(value: unknown, fallback: string | undefined, label: string): string {
  const name = (typeof value === 'string' ? value : fallback ?? '').trim().replace(/\s+/g, ' ')
  if (!name || name.length > 100 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]*$/u.test(name)) {
    throw new Error(`${label} es obligatorio y solo puede contener letras, espacios, apóstrofes, puntos y guiones.`)
  }
  return name
}

export async function registerOnboardingRoutes(app: FastifyInstance, db: typeof prisma) {
  app.get('/api/onboarding', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request, db)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true, email: true, emailVerifiedAt: true,
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
    const candidateReady = user.role === 'CANDIDATE' && isCompleteCandidateProfile(user.candidateProfile)
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role, user.candidateProfile, user.companyProfile,
    )
    const complete = Boolean(profile) && (user.role === 'CANDIDATE'
      ? candidateReady && (user.onboardingStep === 4 || legacyComplete)
      : user.onboardingStep === 4 || legacyComplete)
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
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      step: Math.min(currentStep, 3),
      complete,
      profile,
      catalogs,
    }
  })

  app.post('/api/onboarding/step', async (request, reply) => {
    const sessionUser = await resolveSessionUser(request, db)
    if (!sessionUser) return reply.code(401).send({ message: 'Inicia sesión para continuar.' })

    const body = (request.body ?? {}) as OnboardingPayload
    const step = body.step
    if (step !== 1 && step !== 2 && step !== 3) {
      return reply.code(400).send({ message: 'El paso indicado no es válido.' })
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true, onboardingStep: true,
        candidateProfile: { select: { id: true, firstName: true, lastName: true, phone: true, departmentId: true, municipalityId: true, professionalAreaId: true } },
        companyProfile: { select: { id: true, name: true, departmentId: true, municipalityId: true } },
      },
    })
    if (!user || !['CANDIDATE', 'COMPANY'].includes(user.role)) {
      return reply.code(403).send({ message: 'Esta cuenta no puede completar este perfil.' })
    }

    const existingProfile = user.role === 'CANDIDATE' ? user.candidateProfile : user.companyProfile
    const candidateReady = user.role === 'CANDIDATE' && isCompleteCandidateProfile(user.candidateProfile)
    const legacyComplete = user.onboardingStep == null && hasLegacyCompleteProfile(
      user.role,
      user.candidateProfile,
      user.companyProfile ? { name: user.companyProfile.name } : null,
    )
    const profileComplete = user.role === 'CANDIDATE'
      ? candidateReady && (user.onboardingStep === 4 || legacyComplete)
      : Boolean(existingProfile) && (legacyComplete || user.onboardingStep === 4)
    const currentStep = profileComplete ? 4 : user.onboardingStep === 4 ? 1 : user.onboardingStep ?? 1
    if (currentStep === 4) return reply.code(409).send({ message: 'Este perfil ya está completo.' })
    if (step > currentStep) return reply.code(409).send({ message: 'Completa el paso actual antes de continuar.' })

    try {
      if (user.role === 'CANDIDATE') {
        const old = user.candidateProfile
        let profileId = old?.id

        if (step === 1) {
          const firstName = requiredPersonName(body.firstName, old?.firstName, 'El nombre')
          const lastName = requiredPersonName(body.lastName, old?.lastName, 'Los apellidos')
          const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
          const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
          const mergedDepartmentId = departmentId === undefined ? old?.departmentId : departmentId
          const mergedMunicipalityId = municipalityId === undefined ? old?.municipalityId : municipalityId
          if (!mergedDepartmentId || !mergedMunicipalityId) return reply.code(400).send({ message: 'Selecciona tu departamento y municipio para continuar.' })
          if (mergedDepartmentId && !await db.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un departamento válido.' })
          }
          if (mergedMunicipalityId) {
            const municipality = await db.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
            if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
              return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
            }
          }
          const phone = normalizeNicaraguaPhone(body.phone ?? old?.phone)
          const profile = await db.$transaction(async (tx) => {
            const saved = await tx.candidateProfile.upsert({
              where: { userId: sessionUser.id },
              create: {
                userId: sessionUser.id, firstName, lastName,
                phone,
                ...(mergedDepartmentId ? { departmentId: mergedDepartmentId } : {}),
                ...(mergedMunicipalityId ? { municipalityId: mergedMunicipalityId } : {}),
              },
              update: {
                firstName, lastName,
                phone,
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
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu información personal.' })
          const professionalAreaId = optionalCatalogId(body.professionalAreaId, 'El área profesional')
          const specializationId = optionalCatalogId(body.specializationId, 'La especialización')
          const mergedAreaId = professionalAreaId === undefined ? old.professionalAreaId : professionalAreaId
          if (!mergedAreaId) return reply.code(400).send({ message: 'Selecciona tu área profesional para continuar.' })
          if (mergedAreaId && !await db.professionalArea.findFirst({ where: { id: mergedAreaId, isActive: true }, select: { id: true } })) {
            return reply.code(400).send({ message: 'Selecciona un área profesional válida.' })
          }
          if (specializationId) {
            const specialization = await db.specialization.findFirst({ where: { id: specializationId, isActive: true }, select: { professionalAreaId: true } })
            if (!specialization || !mergedAreaId || specialization.professionalAreaId !== mergedAreaId) {
              return reply.code(400).send({ message: 'La especialización debe corresponder al área seleccionada.' })
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
          if (!old) return reply.code(409).send({ message: 'Guarda primero tu información personal.' })
          if (!isCompleteCandidateProfile(old)) return reply.code(409).send({ message: 'Completa los datos obligatorios del perfil antes de finalizar.' })
          await db.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
          profileId = old.id
        }
        return { ok: true, step: step === 3 ? 4 : step + 1, profileId }
      }

      const old = user.companyProfile
      let profileId = old?.id
      if (step === 1) {
        const name = optionalText(body.companyName, 160, 'El nombre de la empresa') ?? old?.name
        if (!name) return reply.code(400).send({ message: 'Ingresa el nombre de la empresa para continuar.' })
        const economicSectorId = optionalCatalogId(body.economicSectorId, 'El sector económico')
        if (economicSectorId && !await db.economicSector.findFirst({ where: { id: economicSectorId, isActive: true }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un sector válido.' })
        }
        const description = optionalText(body.description, 5000, 'La descripción')
        const website = optionalText(body.website, 2000, 'El sitio web')
        if (website) {
          try {
            const parsed = new URL(website)
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
          } catch {
            return reply.code(400).send({ message: 'Ingresa una dirección web válida.' })
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
        if (!old) return reply.code(409).send({ message: 'Guarda primero la información básica de la empresa.' })
        const departmentId = optionalCatalogId(body.departmentId, 'El departamento')
        const municipalityId = optionalCatalogId(body.municipalityId, 'El municipio')
        const mergedDepartmentId = departmentId === undefined ? old.departmentId : departmentId
        const mergedMunicipalityId = municipalityId === undefined ? old.municipalityId : municipalityId
        if (mergedDepartmentId && !await db.department.findUnique({ where: { id: mergedDepartmentId }, select: { id: true } })) {
          return reply.code(400).send({ message: 'Selecciona un departamento válido.' })
        }
        if (mergedMunicipalityId) {
          const municipality = await db.municipality.findUnique({ where: { id: mergedMunicipalityId }, select: { departmentId: true } })
          if (!municipality || !mergedDepartmentId || municipality.departmentId !== mergedDepartmentId) {
            return reply.code(400).send({ message: 'El municipio debe pertenecer al departamento seleccionado.' })
          }
        }
        const contactEmail = optionalText(body.contactEmail, 254, 'El correo de contacto')
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
          return reply.code(400).send({ message: 'Ingresa un correo de contacto válido.' })
        }
        const phone = optionalPhone(body.phone)
        const address = optionalText(body.address, 500, 'La dirección')
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
        if (!old) return reply.code(409).send({ message: 'Guarda primero la información básica de la empresa.' })
        await db.user.update({ where: { id: sessionUser.id }, data: { onboardingStep: 4 } })
        profileId = old.id
      }
      return { ok: true, step: step === 3 ? 4 : step + 1, profileId }
    } catch (error) {
      if (error instanceof Error && /obligatorio|nicarag|8 d.gitos/i.test(error.message)) {
        return reply.code(400).send({ message: error.message })
      }
      if (error instanceof Error && /no es válido/.test(error.message)) {
        return reply.code(400).send({ message: error.message })
      }
      request.log.error(error)
      return reply.code(500).send({ message: 'No se pudieron guardar los cambios. Inténtalo de nuevo.' })
    }
  })
}
