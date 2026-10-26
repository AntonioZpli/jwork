import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { ensureCatalogDefaults } from '../src/lib/catalogDefaults'
import { ensureNicaraguaLocationCatalog } from '../src/lib/locationCatalog'

async function main() {
  const locations = await ensureNicaraguaLocationCatalog(prisma)
  const defaults = await ensureCatalogDefaults(prisma)
  console.log(`Catalogo geográfico cargado: ${locations.departmentCount} departamentos/regiones y ${locations.municipalityCount} municipios.`)
  console.log(`Catálogos profesionales cargados: ${defaults.areas} áreas, ${defaults.specializations} especializaciones y ${defaults.sectors} sectores.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'No se pudo cargar el catálogo geográfico.')
  process.exitCode = 1
}).finally(async () => {
  await prisma.$disconnect()
})
