import { Component, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, documentId } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Item } from '../../item.model';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { FormsModule } from "@angular/forms";

declare var bootstrap: any; // Ensure Bootstrap modal functions work

@Component({
  selector: 'app-add',
  imports: [FormsModule, CommonModule, NgFor, NgForOf],
  templateUrl: './add.component.html',
  styleUrl: './add.component.css'
})
export class AddComponent {
//new code starts here
public englishWord = '';
public teluguWord = '';
title = 'td';
public name: string = '';
public displayAddError = "";
private firestoreService = inject(FirestoreService);
items: any[] = [];
public items$: Observable<Item[]>;
public selectedItem: Item = { id: '', word: '', meaning: '' };
public searchTerm: string = '';
public filteredItems: Item[] = [];
public status: boolean = false;

constructor(private firestore: Firestore) {
  const itemsCollection = collection(this.firestore, 'dictionary');
  this.items$ = collectionData(itemsCollection, { idField: 'id' }) as Observable<Item[]>;
}

ngOnInit() {
  this.fetchItems();
}

fetchItems() {
  this.items$ = this.firestoreService.getItems(); // Fetch latest data
  this.items$.subscribe(data => {
    this.items = data;
    this.filterItems();
  })
}

addItem() {
  if (this.englishWord === "" || this.teluguWord === "") {
    this.displayAddError = "Please Enter English Word and Telugu Word";
  } else {
    this.displayAddError = "";
    const itemsCollection = collection(this.firestore, 'dictionary');
    addDoc(itemsCollection, { word: this.englishWord, meaning: this.teluguWord });
    this.englishWord = '';
    this.teluguWord = '';
    this.fetchItems();
  }
}

openUpdateModal(item: Item) {
  this.selectedItem = { ...item };
}

updateItem() {
  if (this.selectedItem.id) {
    const itemDocRef = doc(this.firestore, 'dictionary', this.selectedItem.id);
    updateDoc(itemDocRef, { id: this.selectedItem.id, word: this.selectedItem.word, meaning: this.selectedItem.meaning }).then(() => {
      // this.fetchItems();
      this.closeModal('updateModal');
    });
  }
}

openDeleteModal(item: Item) {
  this.selectedItem = item;
}

deleteItem() {
  if (this.selectedItem.id) {
    const itemDocRef = doc(this.firestore, 'dictionary', this.selectedItem.id);
    deleteDoc(itemDocRef).then(() => {
      this.fetchItems();
      this.closeModal('deleteModal');
    });
  }
}

closeModal(modalId: string) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }
}

openModal(modalId: string) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.show();
  }
}

filterItems() {
  this.filteredItems = this.items.filter(item =>
    item.word.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}
}
