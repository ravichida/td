import { Component, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, documentId } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Item } from '../../item.model';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { CustomSortPipe } from '../../pipes/custom-sort.pipe';

//Paginator imports starts here
//Paginator imports ends here
declare var bootstrap: any; // Ensure Bootstrap modal functions work

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
  imports: [FormsModule, CommonModule, NgFor, NgForOf],
  standalone: true,
})
export class SearchComponent {
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
  public sortedItems: Item[] = [];
  public sortOrder: boolean = false;


  constructor(private firestore: Firestore, private fs: FirestoreService) {
    // const itemsCollection = collection(this.firestore, 'dictionary');
    // this.items$ = collectionData(itemsCollection, { idField: 'id' }) as Observable<Item[]>;
    this.items$ = this.fs.getItems();
  }
  
  ngOnInit() {
    this.fetchItems();
  }

  fetchItems() {
    this.items$ = this.fs.getItems(); // Fetch latest data
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
    this.selectedItem = { ...item }; // Convert word to title case
    this.selectedItem.word = this.convertToTitleCase(item.word); // Convert meaning to title case
  }

  updateItem() {
    if (this.selectedItem.id) {
      const itemDocRef = doc(this.firestore, 'dictionary', this.selectedItem.id);
      updateDoc(itemDocRef, { id: this.selectedItem.id, word: this.selectedItem.word.toUpperCase(), meaning: this.selectedItem.meaning }).then(() => {
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
    this.sortedItems = new CustomSortPipe().transform(this.filteredItems, 'word', this.sortOrder ? 'desc' : 'asc');
    console.log(this.sortedItems);
  }

  toggleSortOrder() {
    this.sortOrder = !this.sortOrder;
    this.filterItems();
  }

  convertToTitleCase(value: string): string {
    return value.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }
  //new code ends here
}