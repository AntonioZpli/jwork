/** Work modality options */
export type Modality = 'Presencial' | 'Híbrido' | 'Remoto'

/** Contract type options */
export type ContractType = 'Tiempo completo' | 'Tiempo parcial' | 'Freelance'

/** Job category */
export type JobCategory = 'Tecnología' | 'Diseño' | 'Administración' | 'Marketing' | 'Ventas' | 'Soporte'

/** A single illustrative job listing */
export interface Job {
  /** Unique identifier */
  id: string
  /** Company display name */
  company: string
  /** Company initials (used for the avatar square) */
  initials: string
  /** Which avatar color variant to use — derived from Orchid tokens */
  avatarVariant: 'violet' | 'deep' | 'soft' | 'muted'
  /** Job category label */
  category: JobCategory
  /** Full job title */
  title: string
  /** City or region */
  location: string
  /** Work modality */
  modality: Modality
  /** Contract type */
  contract: ContractType
}
