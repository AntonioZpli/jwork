import { readFile } from 'node:fs/promises'

export async function ensureNicaraguaLocationCatalog(db: any) {
  const raw = await readFile(new URL('../../prisma/seed/nicaragua-locations.json', import.meta.url), 'utf8')
  const payload = JSON.parse(raw) as {
    Nicaragua?: {
      departamentos?: Array<{ nombre: string; municipios: string[] }>
      regiones_autonomas?: Array<{ nombre: string; municipios: string[] }>
    }
  }

  const country = payload.Nicaragua
  if (!country) {
    throw new Error('No se encontró la sección Nicaragua en el catálogo de localidades.')
  }

  const groups = [
    ...(country.departamentos ?? []).map(({ nombre, municipios }) => ({ name: nombre, municipios })),
    ...(country.regiones_autonomas ?? []).map(({ nombre, municipios }) => ({ name: nombre, municipios })),
  ]

  const result = await db.$transaction(async (tx: any) => {
    let departmentCount = 0
    let municipalityCount = 0

    for (const group of groups) {
      const department = await tx.department.upsert({
        where: { name: group.name },
        update: {},
        create: { name: group.name },
        select: { id: true, name: true },
      })
      departmentCount += 1

      for (const municipio of group.municipios) {
        await tx.municipality.upsert({
          where: {
            departmentId_name: {
              departmentId: department.id,
              name: municipio,
            },
          },
          update: {},
          create: {
            departmentId: department.id,
            name: municipio,
          },
        })
        municipalityCount += 1
      }
    }

    return { departmentCount, municipalityCount }
  })

  return result
}
