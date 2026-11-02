const ignoredWords = new Set(['a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'y'])

/** Returns a compact mark based on the vacancy title. */
export function vacancyInitials(title: string | null | undefined) {
  const words = (title ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'V'

  const meaningfulWords = words.filter(word => !ignoredWords.has(word.toLocaleLowerCase('es')))
  if (meaningfulWords.length > 1) {
    return meaningfulWords.slice(0, 2).map(word => Array.from(word)[0]?.toLocaleUpperCase('es') ?? '').join('')
  }

  return Array.from(words[0] ?? '').slice(0, 2).join('').toLocaleUpperCase('es') || 'V'
}
