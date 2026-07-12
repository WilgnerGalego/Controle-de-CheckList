const STORAGE_KEY = 'checklist-frotas'
const DEFAULT_FROTAS = ['4001', '4002', '4003']

const normalizeFrota = (value: string) => value.trim().toUpperCase()

const readStoredFrotas = (): string[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_FROTAS]
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return [...DEFAULT_FROTAS]
    }

    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_FROTAS]
    }

    const normalized = parsed.filter((item): item is string => typeof item === 'string').map(normalizeFrota).filter(Boolean)
    return normalized.length > 0 ? Array.from(new Set(normalized)) : [...DEFAULT_FROTAS]
  } catch {
    return [...DEFAULT_FROTAS]
  }
}

const persistFrotas = (frotas: string[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(frotas))
  }
}

export const frotaService = {
  list(): string[] {
    const stored = readStoredFrotas()
    persistFrotas(stored)
    return stored
  },

  add(value: string): string[] {
    const normalized = normalizeFrota(value)
    if (!normalized) {
      return this.list()
    }

    const current = readStoredFrotas()
    const next = Array.from(new Set([...current, normalized]))
    persistFrotas(next)
    return next
  },
}
