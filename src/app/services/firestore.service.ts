import { Injectable, inject } from '@angular/core';
// import { Firestore, collection, query, collectionData, doc, deleteDoc, updateDoc, orderBy, limit, startAfter, getDoc, getDocs, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter
} from '@angular/fire/firestore';
import { docData } from '@angular/fire/firestore';
import { CollectionReference, collection as colRef, DocumentData } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';

export interface DictionaryItem {
  id?: string;
  word: string;
  meaning: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  firestore: Firestore;
  collectionRef: CollectionReference<DocumentData>;
  collectionName = 'dictionary'; // Define the collection name here

  constructor() {
    this.firestore = inject(Firestore);
    this.collectionRef = collection(this.firestore, 'dictionary'); // ✅ Safe to use here
  }


  // private collectionName = 'dictionary';

  // private firestore = inject(Firestore);
  // private firestore: Firestore = inject(Firestore);

  // private collectionRef = collection(this.firestore, this.collectionName);

  async getPaginatedItems(pageSize: number, lastVisibleItem: any = null): Promise<DictionaryItem[]> {
    // let collectionRef = collection(this.firestore, this.collectionName);
    let q = query(this.collectionRef, orderBy('word'), limit(pageSize));

    if (lastVisibleItem) {
      q = query(this.collectionRef, orderBy('word'), startAfter(lastVisibleItem), limit(pageSize));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DictionaryItem));
  }

  getDictionaryItems(): Observable<DictionaryItem[]> {
    const colRef = collection(this.firestore, 'dictionary');
    return collectionData(this.collectionRef, { idField: 'id' }) as Observable<DictionaryItem[]>;
  }

  // Get a single item by ID

  getItemByWord(word: string): Promise<any[]> {
    const colRef = collection(this.firestore, 'dictionary');
    const q = query(this.collectionRef, where('word', '==', word.toUpperCase()));
    return getDocs(q).then(snapshot => {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  getItemById(id: string) {
    const docRef = doc(this.firestore, 'dictionary', id);
    // return docSnapshots(docRef);
    return docData(docRef); // ✅ Returns only document data as an observable
  }

  // Get all items
  getItems(): Observable<any[]> {
    // const collectionRef = collection(this.firestore, 'dictionary');
    return collectionData(this.collectionRef, { idField: 'id' });
  }

    /* getItems(): Promise<any[]> {
      const collectionRef = collection(this.firestore, 'dictionary');
      return getDocs(collectionRef).then(snapshot =>
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
    } */

  addItemToFirestore(item: any): Promise<any> {
    const colRef = collection(this.firestore, 'dictionary');
    return addDoc(this.collectionRef, item).then(docRef => {
      return getDoc(docRef).then(snapshot => ({
        id: docRef.id,
        ...snapshot.data()
      }));
    });
  }

  // Delete an item
  async deleteItem(id: string) {
    await deleteDoc(doc(this.firestore, `items/${id}`));
  }

  deleteItemById(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'dictionary', id);
    return deleteDoc(docRef);
  }

  // Update an existing item
  updateItemAndFetch(id: string, data: any): Promise<any> {
    const docRef = doc(this.firestore, 'dictionary', id);
    return updateDoc(docRef, data).then(() => {
      return getDoc(docRef).then(snapshot => ({
        id: snapshot.id,
        ...snapshot.data()
      }));
    });
  }

  getAllItems(): Promise<any[]> {
    // const colRef = collection(this.firestore, 'dictionary');
    return getDocs(this.collectionRef).then(snapshot =>
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    );
  }


}
