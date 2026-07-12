const STORAGE_KEY = 'checklist-audit-log-v1'

export interface AuditEntry {
  id: string
  message: string
  type: 'checklist' | 'nonconformity' | 'settings' | 'equipment' | 'category' | 'item'
  timestamp: string
}

const readEntries = (): AuditEntry[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    return JSON.parse(raw) as AuditEntry[]
  } catch {
    return []
  }
}

export const auditService = {
  list(): AuditEntry[] {
    return readEntries().slice(0, 10)
  },

  add(message: string, type: AuditEntry['type']): AuditEntry {
    const entry: AuditEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      message,
      type,
      timestamp: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      const entries = [entry, ...readEntries()].slice(0, 20)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    }

    return entry
  },
}
