import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, docSnapshots, collectionData, doc, docData, deleteDoc, updateDoc, orderBy, limit, startAfter, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface DictionaryItem {
  id?: string;
  word: string;
  meaning: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private collectionName = 'dictionary';

  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'dictionary');

  async getPaginatedItems(pageSize: number, lastVisibleItem: any = null): Promise<DictionaryItem[]> {
    let collectionRef = collection(this.firestore, this.collectionName);
    let q = query(collectionRef, orderBy('word'), limit(pageSize));

    if (lastVisibleItem) {
      q = query(collectionRef, orderBy('word'), startAfter(lastVisibleItem), limit(pageSize));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DictionaryItem));
  }

  getDictionaryItems(): Observable<DictionaryItem[]> {
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<DictionaryItem[]>;
  }

  // Get a single item by ID
  


  getItemById(id: string) {
    const docRef = doc(this.firestore, 'dictionary', id);
    // return docSnapshots(docRef);
    return docData(docRef); // ✅ Returns only document data as an observable
  }

  // Get all items
  getItems(): Observable<any[]> {
    return collectionData(this.collectionRef, { idField: 'id' });
  }

  // Add a new item
  async addItem(item: any) {
    await addDoc(this.collectionRef, item);
  }

  // Delete an item
  async deleteItem(id: string) {
    await deleteDoc(doc(this.firestore, `items/${id}`));
  }

  // Update an existing item
  async updateItem(id: string, updatedData: any) {
    const docRef = doc(this.firestore, `items/${id}`);
    await updateDoc(docRef, updatedData);
  }
}
