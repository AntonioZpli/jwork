export function optionalText(value: unknown, maxLength: number, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new Error(`${label} no es válido.`)
  }
  const clean = value.trim()
  return clean || undefined
}

export function optionalPhone(value: unknown): string | undefined {
  const phone = optionalText(value, 40, 'El teléfono')
  if (phone && !/^\+?[0-9()\s.-]{7,40}$/.test(phone)) throw new Error('El teléfono no es válido.')
  return phone
}
