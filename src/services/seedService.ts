import { addDoc, collection, getDocs } from 'firebase/firestore'
import { firestore } from './firebase'
import { initialCategoriesSeed, initialEquipmentSeed, initialItemsSeed } from '../database/seedData'

export async function seedFirestoreBaseData() {
  const collectionsToSeed = [
    { name: 'equipamentos', data: initialEquipmentSeed },
    { name: 'categoriasChecklist', data: initialCategoriesSeed },
    { name: 'itensChecklist', data: initialItemsSeed },
  ] as const

  for (const collectionSeed of collectionsToSeed) {
    const snapshot = await getDocs(collection(firestore, collectionSeed.name))
    if (!snapshot.empty) {
      continue
    }

    for (const item of collectionSeed.data) {
      await addDoc(collection(firestore, collectionSeed.name), item)
    }
  }
}
