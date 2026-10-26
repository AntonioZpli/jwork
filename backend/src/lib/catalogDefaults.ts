type CatalogEntry = { name: string; specializations?: string[] }

const professionalAreas: CatalogEntry[] = [
  { name: 'Tecnología e informática', specializations: ['Desarrollo de software', 'Soporte técnico', 'Ciberseguridad', 'Diseño UX/UI', 'Datos e inteligencia artificial'] },
  { name: 'Administración y negocios', specializations: ['Administración', 'Finanzas', 'Recursos humanos', 'Ventas', 'Compras y logística'] },
  { name: 'Salud y bienestar', specializations: ['Enfermería', 'Farmacia', 'Atención médica', 'Nutrición', 'Psicología'] },
  { name: 'Educación y formación', specializations: ['Docencia', 'Capacitación', 'Idiomas', 'Bibliotecología', 'Educación superior'] },
  { name: 'Ingeniería y construcción', specializations: ['Civil', 'Eléctrica', 'Mecánica', 'Arquitectura', 'Construcción'] },
  { name: 'Producción y manufactura', specializations: ['Operación de maquinaria', 'Calidad', 'Producción', 'Logística industrial', 'Mantenimiento industrial'] },
  { name: 'Gastronomía y servicio', specializations: ['Cocina', 'Panadería', 'Bebidas', 'Servicio al cliente', 'Hotelería'] },
  { name: 'Diseño y creatividad', specializations: ['Diseño gráfico', 'Marketing digital', 'Fotografía', 'Comunicación', 'Contenido audiovisual'] },
  { name: 'Agronomía y medio ambiente', specializations: ['Agronomía', 'Agroindustria', 'Horticultura', 'Forestal', 'Medio ambiente'] },
  { name: 'Transporte y logística', specializations: ['Operación de transporte', 'Almacén', 'Distribución', 'Cadena de suministro', 'Logística internacional'] },
  { name: 'Legal y servicios profesionales', specializations: ['Derecho', 'Contabilidad', 'Auditoría', 'Asesoría', 'Gestión documental'] },
  { name: 'Comunicaciones y medios', specializations: ['Periodismo', 'Comunicación', 'Relaciones públicas', 'Estrategia digital', 'Producción audiovisual'] },
]

const economicSectors = [
  'Agroindustria',
  'Alimentación y bebidas',
  'Comercio minorista',
  'Construcción',
  'Educación',
  'Energía',
  'Entretenimiento y medios',
  'Finanzas y seguros',
  'Gastronomía y turismo',
  'Logística y transporte',
  'Manufactura',
  'Salud',
  'Servicios profesionales',
  'Tecnología',
]

export async function ensureCatalogDefaults(db: any) {
  const result = await db.$transaction(async (tx: any) => {
    let areas = 0
    let sectors = 0
    let specializations = 0

    for (const area of professionalAreas) {
      const created = await tx.professionalArea.upsert({
        where: { name: area.name },
        update: {},
        create: { name: area.name },
        select: { id: true, name: true },
      })
      areas += 1

      for (const specializationName of area.specializations ?? []) {
        await tx.specialization.upsert({
          where: {
            professionalAreaId_name: {
              professionalAreaId: created.id,
              name: specializationName,
            },
          },
          update: {},
          create: {
            professionalAreaId: created.id,
            name: specializationName,
          },
        })
        specializations += 1
      }
    }

    for (const sectorName of economicSectors) {
      await tx.economicSector.upsert({
        where: { name: sectorName },
        update: {},
        create: { name: sectorName },
      })
      sectors += 1
    }

    return { areas, sectors, specializations }
  })

  return result
}
