import type { Job } from '@/types/job'

/** Ofertas ficticias para mostrar cómo lucirá la plataforma. */
export const FEATURED_JOBS: Job[] = [
  {
    id: 'nexo-frontend',
    company: 'Nexo Digital',
    initials: 'N',
    avatarVariant: 'violet',
    category: 'Tecnología',
    title: 'Desarrollador/a frontend',
    location: 'Jinotega',
    modality: 'Híbrido',
    contract: 'Tiempo completo',
  },
  {
    id: 'orbita-design',
    company: 'Órbita Estudio',
    initials: 'O',
    avatarVariant: 'deep',
    category: 'Diseño',
    title: 'Diseñador/a gráfico/a',
    location: 'Jinotega',
    modality: 'Remoto',
    contract: 'Tiempo completo',
  },
  {
    id: 'casa-norte-admin',
    company: 'Casa Norte',
    initials: 'C',
    avatarVariant: 'soft',
    category: 'Administración',
    title: 'Asistente administrativo/a',
    location: 'Estelí',
    modality: 'Presencial',
    contract: 'Tiempo completo',
  },
  {
    id: 'punto-analitico-data',
    company: 'Punto Analítico',
    initials: 'P',
    avatarVariant: 'muted',
    category: 'Tecnología',
    title: 'Analista de datos',
    location: 'Managua',
    modality: 'Híbrido',
    contract: 'Tiempo completo',
  },
]