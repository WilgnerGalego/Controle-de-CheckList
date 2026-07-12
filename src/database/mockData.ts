import type { ChecklistRecord, DashboardMetric, EquipmentItem, NonConformity } from '../types'

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Checklists lançados', value: '128', detail: 'Últimos 30 dias', color: '#2e7d32' },
  { label: 'Equipamentos ativos', value: '24', detail: 'Em operação', color: '#1565c0' },
  { label: 'Não conformidades', value: '9', detail: 'Pendentes de ação', color: '#c62828' },
]

export const equipmentList: EquipmentItem[] = [
  { id: 1, name: 'Trator Valtra', type: 'Trator', status: 'Disponível', lastChecklist: '12/07/2026' },
  { id: 2, name: 'Colhedora Case', type: 'Colhedora', status: 'Em uso', lastChecklist: '11/07/2026' },
  { id: 3, name: 'Pulverizador Jacto', type: 'Pulverizador', status: 'Manutenção', lastChecklist: '10/07/2026' },
]

export const checklistHistory: ChecklistRecord[] = [
  { id: 'CHK-001', equipment: 'Trator Valtra', type: 'Trator', date: '12/07/2026', status: 'Concluído', gatecNumber: 'OS-1042' },
  { id: 'CHK-002', equipment: 'Colhedora Case', type: 'Colhedora', date: '11/07/2026', status: 'Pendente', gatecNumber: 'OS-1043' },
  { id: 'CHK-003', equipment: 'Pulverizador Jacto', type: 'Pulverizador', date: '10/07/2026', status: 'Em aberto' },
]

export const nonConformities: NonConformity[] = [
  { id: 'NC-001', equipment: 'Colhedora Case', description: 'Vazamento hidráulico no braço.', severity: 'Alta', gatecNumber: 'OS-1043' },
  { id: 'NC-002', equipment: 'Trator Valtra', description: 'Freio com ruído durante teste.', severity: 'Média' },
]

export const monthlyChartData = [
  { month: 'Jan', checklists: 18 },
  { month: 'Fev', checklists: 22 },
  { month: 'Mar', checklists: 20 },
  { month: 'Abr', checklists: 25 },
  { month: 'Mai', checklists: 24 },
  { month: 'Jun', checklists: 29 },
  { month: 'Jul', checklists: 30 },
]
