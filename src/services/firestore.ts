import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestore } from './firebase'
import type {
  CategoryChecklist,
  ChecklistDoc,
  ChecklistResponse,
  Equipment,
  ItemChecklist,
  NonConformity,
  ReportDoc,
  ChecklistResponseResult,
} from '../types/firestore'

const COLLECTIONS = {
  equipamentos: 'equipamentos',
  categoriasChecklist: 'categoriasChecklist',
  itensChecklist: 'itensChecklist',
  checklists: 'checklists',
  respostasChecklist: 'respostasChecklist',
  naoConformidades: 'naoConformidades',
  relatorios: 'relatorios',
} as const

const getCollection = (name: keyof typeof COLLECTIONS) => collection(firestore, COLLECTIONS[name])

export const equipmentService = {
  async list(): Promise<Equipment[]> {
    const snapshot = await getDocs(query(getCollection('equipamentos'), orderBy('frota')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Equipment) }))
  },

  async listActive(): Promise<Equipment[]> {
    const equipments = await this.list()
    return equipments.filter((item) => item.status === 'Ativo')
  },

  async getById(id: string): Promise<Equipment | null> {
    const snapshot = await getDoc(doc(firestore, COLLECTIONS.equipamentos, id))
    return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Equipment) }) : null
  },

  async create(data: Equipment): Promise<string> {
    const ref = await addDoc(getCollection('equipamentos'), data)
    return ref.id
  },

  async update(id: string, data: Partial<Equipment>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.equipamentos, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.equipamentos, id))
  },
}

export const categoryChecklistService = {
  async listByEquipment(type: string): Promise<CategoryChecklist[]> {
    const snapshot = await getDocs(query(getCollection('categoriasChecklist'), where('tipoEquipamento', '==', type), orderBy('ordem')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as CategoryChecklist) }))
  },

  async create(data: CategoryChecklist): Promise<string> {
    const ref = await addDoc(getCollection('categoriasChecklist'), data)
    return ref.id
  },

  async update(id: string, data: Partial<CategoryChecklist>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.categoriasChecklist, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.categoriasChecklist, id))
  },
}

export const itemChecklistService = {
  async listByEquipment(type: string): Promise<ItemChecklist[]> {
    const snapshot = await getDocs(query(getCollection('itensChecklist'), where('tipoEquipamento', '==', type), orderBy('ordem')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as ItemChecklist) }))
  },

  async create(data: ItemChecklist): Promise<string> {
    const ref = await addDoc(getCollection('itensChecklist'), data)
    return ref.id
  },

  async update(id: string, data: Partial<ItemChecklist>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.itensChecklist, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.itensChecklist, id))
  },
}

export const checklistService = {
  async list(): Promise<ChecklistDoc[]> {
    const snapshot = await getDocs(query(getCollection('checklists'), orderBy('data', 'desc')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as ChecklistDoc) }))
  },

  async create(data: ChecklistDoc): Promise<string> {
    const ref = await addDoc(getCollection('checklists'), data)
    return ref.id
  },

  async createWithResponses(data: ChecklistDoc, items: ItemChecklist[]): Promise<string> {
    const ref = await addDoc(getCollection('checklists'), data)

    const responses = items.map((item) => ({
      checklistId: ref.id,
      itemId: item.id ?? '',
      categoria: item.categoria,
      item: item.descricao,
      resultado: 'Conforme' as ChecklistResponseResult,
      observacao: '',
    }))

    await Promise.all(responses.map((response) => addDoc(getCollection('respostasChecklist'), response)))

    return ref.id
  },

  async update(id: string, data: Partial<ChecklistDoc>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.checklists, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.checklists, id))
  },
}

export const checklistResponseService = {
  async listAll(): Promise<ChecklistResponse[]> {
    const snapshot = await getDocs(getCollection('respostasChecklist'))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as ChecklistResponse) }))
  },

  async listByChecklist(checklistId: string): Promise<ChecklistResponse[]> {
    const snapshot = await getDocs(query(getCollection('respostasChecklist'), where('checklistId', '==', checklistId)))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as ChecklistResponse) }))
  },

  async create(data: ChecklistResponse): Promise<string> {
    const ref = await addDoc(getCollection('respostasChecklist'), data)
    return ref.id
  },

  async update(id: string, data: Partial<ChecklistResponse>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.respostasChecklist, id), data)
  },
}

export const nonConformityService = {
  async list(): Promise<NonConformity[]> {
    const snapshot = await getDocs(query(getCollection('naoConformidades'), orderBy('data', 'desc')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as NonConformity) }))
  },

  async create(data: NonConformity): Promise<string> {
    const ref = await addDoc(getCollection('naoConformidades'), data)
    return ref.id
  },

  async update(id: string, data: Partial<NonConformity>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.naoConformidades, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.naoConformidades, id))
  },
}

export const reportService = {
  async list(): Promise<ReportDoc[]> {
    const snapshot = await getDocs(query(getCollection('relatorios'), orderBy('criadoEm', 'desc')))
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as ReportDoc) }))
  },

  async create(data: ReportDoc): Promise<string> {
    const ref = await addDoc(getCollection('relatorios'), data)
    return ref.id
  },

  async update(id: string, data: Partial<ReportDoc>): Promise<void> {
    await updateDoc(doc(firestore, COLLECTIONS.relatorios, id), data)
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(firestore, COLLECTIONS.relatorios, id))
  },
}

export const firestoreCollections = COLLECTIONS

export const buildChecklistResponse = (
  checklistId: string,
  item: ItemChecklist,
  resultado: ChecklistResponseResult = 'Conforme',
): ChecklistResponse => ({
  checklistId,
  itemId: item.id ?? '',
  categoria: item.categoria,
  item: item.descricao,
  resultado,
  observacao: '',
})
