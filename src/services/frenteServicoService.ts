const STORAGE_KEY = 'checklist-frentes-servico'
const DEFAULT_FRENTES = ['4001', '4002', '4003']

const normalizeFrente = (value: string) => value.trim().toUpperCase()

const readStoredFrentes = (): string[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_FRENTES]
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return [...DEFAULT_FRENTES]
    }

    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_FRENTES]
    }

    const normalized = parsed.filter((item): item is string => typeof item === 'string').map(normalizeFrente).filter(Boolean)
    return normalized.length > 0 ? Array.from(new Set(normalized)) : [...DEFAULT_FRENTES]
  } catch {
    return [...DEFAULT_FRENTES]
  }
}

const persistFrentes = (frentes: string[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(frentes))
  }
}

export const frenteServicoService = {
  list(): string[] {
    const stored = readStoredFrentes()
    persistFrentes(stored)
    return stored
  },

  add(value: string): string[] {
    const normalized = normalizeFrente(value)
    if (!normalized) {
      return this.list()
    }

    const current = readStoredFrentes()
    const next = Array.from(new Set([...current, normalized]))
    persistFrentes(next)
    return next
  },
}
