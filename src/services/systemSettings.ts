import type { NonConformityPriority } from '../types/firestore'

const STORAGE_KEY = 'checklist-system-settings-v1'

export interface SystemSettings {
  companyName: string
  responsibleName: string
  checklistNote: string
  defaultPriority: NonConformityPriority
  priorities: NonConformityPriority[]
}

export const defaultSystemSettings: SystemSettings = {
  companyName: 'Fazenda Modelo',
  responsibleName: 'Responsável do checklist',
  checklistNote: 'Checklist diário de segurança e operação.',
  defaultPriority: 'Média',
  priorities: ['Baixa', 'Média', 'Alta'],
}

const normalizePriorities = (priorities: NonConformityPriority[]): NonConformityPriority[] => {
  const unique = Array.from(new Set(priorities.filter(Boolean))) as NonConformityPriority[]
  return unique.length > 0 ? unique : defaultSystemSettings.priorities
}

export const systemSettingsService = {
  get(): SystemSettings {
    if (typeof window === 'undefined') {
      return defaultSystemSettings
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return defaultSystemSettings
      }

      const parsed = JSON.parse(raw) as Partial<SystemSettings>
      return {
        ...defaultSystemSettings,
        ...parsed,
        priorities: normalizePriorities(parsed.priorities ?? defaultSystemSettings.priorities),
      }
    } catch {
      return defaultSystemSettings
    }
  },

  save(settings: Partial<SystemSettings>): SystemSettings {
    const current = this.get()
    const next: SystemSettings = {
      ...current,
      ...settings,
      priorities: normalizePriorities(settings.priorities ?? current.priorities),
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }

    return next
  },
}
