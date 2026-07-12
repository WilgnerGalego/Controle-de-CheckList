import type { CategoryChecklist, Equipment, ItemChecklist } from '../types/firestore'

export const initialEquipmentSeed: Equipment[] = [
  { frota: 'FROTA-01', tipoEquipamento: 'Trator', status: 'Ativo' },
  { frota: 'FROTA-02', tipoEquipamento: 'Colhedora', status: 'Ativo' },
]

export const initialCategoriesSeed: CategoryChecklist[] = [
  { nome: 'Segurança', tipoEquipamento: 'Trator', ordem: 1, ativo: true },
  { nome: 'Hidráulico', tipoEquipamento: 'Trator', ordem: 2, ativo: true },
  { nome: 'Segurança', tipoEquipamento: 'Colhedora', ordem: 1, ativo: true },
  { nome: 'Operação', tipoEquipamento: 'Colhedora', ordem: 2, ativo: true },
]

export const initialItemsSeed: ItemChecklist[] = [
  { categoria: 'Segurança', descricao: 'Luzes operacionais', tipoEquipamento: 'Trator', ordem: 1, ativo: true },
  { categoria: 'Segurança', descricao: 'Extintor disponível', tipoEquipamento: 'Trator', ordem: 2, ativo: true },
  { categoria: 'Hidráulico', descricao: 'Vazamentos ausentes', tipoEquipamento: 'Trator', ordem: 3, ativo: true },
  { categoria: 'Segurança', descricao: 'Cintos de segurança', tipoEquipamento: 'Colhedora', ordem: 1, ativo: true },
  { categoria: 'Operação', descricao: 'Sistema de corte funcionando', tipoEquipamento: 'Colhedora', ordem: 2, ativo: true },
]
