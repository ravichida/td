import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'dictionary');

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
