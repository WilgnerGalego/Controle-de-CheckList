export type EquipmentType = 'Colhedora' | 'Trator'
export type EquipmentStatus = 'Ativo' | 'Inativo'
export type ChecklistTurno = 'A' | 'B' | 'C'
export type ChecklistStatus = 'Em andamento' | 'Finalizado'
export type ChecklistResponseResult = 'Conforme' | 'Não Conforme'
export type NonConformityPriority = 'Baixa' | 'Média' | 'Alta'
export type NonConformityStatus = 'Pendente' | 'O.S. aberta' | 'Em manutenção' | 'Concluída'

export interface Equipment {
  id?: string
  frota: string
  tipoEquipamento: EquipmentType
  status: EquipmentStatus
}

export interface CategoryChecklist {
  id?: string
  nome: string
  tipoEquipamento: EquipmentType
  ordem: number
  ativo: boolean
}

export interface ItemChecklist {
  id?: string
  categoria: string
  descricao: string
  tipoEquipamento: EquipmentType
  ordem: number
  ativo: boolean
}

export interface ChecklistDoc {
  id?: string
  data: string
  hora: string
  turno: ChecklistTurno
  frota: string
  tipoEquipamento: EquipmentType
  quantidadeItens: number
  quantidadeConformes: number
  quantidadeNaoConformes: number
  status: ChecklistStatus
}

export interface ChecklistResponse {
  id?: string
  checklistId: string
  itemId: string
  categoria: string
  item: string
  resultado: ChecklistResponseResult
  observacao?: string
}

export interface NonConformity {
  id?: string
  checklistId: string
  data: string
  hora: string
  turno: ChecklistTurno
  frota: string
  tipoEquipamento: EquipmentType
  categoria: string
  item: string
  descricaoDefeito: string
  prioridade: NonConformityPriority
  numeroOSGATEC?: string
  status: NonConformityStatus
}

export interface ReportDoc {
  id?: string
  titulo: string
  tipo: string
  dados: Record<string, unknown>
  criadoEm?: string
  atualizadoEm?: string
}
