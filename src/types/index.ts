export type ChecklistStatus = 'Em aberto' | 'Concluído' | 'Pendente'

export interface EquipmentItem {
  id: number
  name: string
  type: string
  status: string
  lastChecklist: string
}

export interface ChecklistRecord {
  id: string
  equipment: string
  type: string
  date: string
  status: ChecklistStatus
  gatecNumber?: string
}

export interface NonConformity {
  id: string
  equipment: string
  description: string
  severity: string
  gatecNumber?: string
}

export interface DashboardMetric {
  label: string
  value: string
  detail: string
  color: string
}
