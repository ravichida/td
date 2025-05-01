import { Component, ViewChild, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, documentId } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Item } from '../../item.model';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { FormsModule, NgForm } from "@angular/forms";

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
  public displayAddError: string | null = null;
  private firestoreService = inject(FirestoreService);
  items: any[] = [];
  public selectedItem: Item = { id: '', word: '', meaning: '' };
  public searchTerm: string = '';
  public filteredItems: Item[] = [];
  public addedItem: Item[] = [];
  public displayUpdateError = '';

  @ViewChild('wordForm') wordForm!: NgForm; // 👈 reference to the form

  constructor(private firestore: Firestore, firestoreService: FirestoreService) {
    this.firestoreService = firestoreService;
    this.firestore = firestore;
  }

  ngOnInit() {
    this.getItems();
  }

  getItems() {
    // Fetch latest data from Firestore
    this.firestoreService.getItems().subscribe(data => {
      this.items = data;
      this.filterItems();
    });
    /* this.firestoreService.getItems().then(data => {
      this.items = data;
      this.filterItems();
  })
    .catch(error => {
      console.error('Error fetching items:', error);
    }); */
  } 

  addItem(): void {
    const trimmedWord = (this.englishWord ?? '').trim().toUpperCase();
    const trimmedMeaning = (this.teluguWord ?? '').trim();

    if (!trimmedWord || !trimmedMeaning) {
      this.displayAddError = 'Both Word and Meaning are required';
      this.clearErrorMessageAfterDelay();
      return;
    }

    this.firestoreService.getItemByWord(trimmedWord).then(result => {
      const isDuplicate = result.some(item => (item['word'] ?? '').toUpperCase() === trimmedWord);

      if (isDuplicate) {
        this.displayAddError = 'Word already exists';
        this.clearErrorMessageAfterDelay();
      } else {
        const newItem = {
          word: trimmedWord,
          meaning: trimmedMeaning
        };

        this.firestoreService.addItemToFirestore(newItem).then(addedItem => {
          this.addedItem.push(addedItem);
          this.displayAddError = '';

          if (this.wordForm) {
            this.wordForm.resetForm();
          }

          this.englishWord = '';
          this.teluguWord = '';
        }).catch(error => {
          this.displayAddError = 'Failed to add item. Please try again';
          this.clearErrorMessageAfterDelay();
          console.error('Add error:', error);
        });
      }
    });
  }

  openUpdateModal(item: Item) {
    this.selectedItem = { ...item };
  }

  updateItem(): void {
    const trimmedWord = (this.selectedItem.word ?? '').trim().toUpperCase();
    const trimmedMeaning = (this.selectedItem.meaning ?? '').trim();

    if (!trimmedWord || !trimmedMeaning) {
      this.displayAddError = 'Both Word and Meaning are required';
      this.clearErrorMessageAfterDelay();
      return;
    }

    this.firestoreService.getItemByWord(trimmedWord).then(result => {
      const conflict = result.find(item =>
        (item['word'] ?? '').toUpperCase() === trimmedWord &&
        item['id'] !== this.selectedItem.id
      );

      if (conflict) {
        this.displayAddError = 'Another entry with this word already exists';
        this.clearErrorMessageAfterDelay();
      } else {
        const updatedData = {
          word: trimmedWord,
          meaning: trimmedMeaning
        };

        if (!this.selectedItem.id) {
          this.displayAddError = 'Item ID is missing for update';
          this.clearErrorMessageAfterDelay();
          return;
        }

        this.firestoreService.updateItemAndFetch(this.selectedItem.id!, updatedData).then(updatedDoc => {
          const index = this.addedItem.findIndex(item => item.id === updatedDoc.id);
          if (index !== -1) {
            this.addedItem[index] = updatedDoc; // ✅ replace with fresh document from DB
            this.displayAddError = 'Updated Successfully';
            this.clearErrorMessageAfterDelay();
          }

          // this.displayAddError = '';
          // (document.getElementById('updateModalCloseButton') as HTMLElement)?.click();
          // ✅ Close modal
          const modalEl = document.getElementById('updateModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
          }
        }).catch(error => {
          this.displayAddError = 'Failed to update item. Please try again';
          this.clearErrorMessageAfterDelay();
          console.error('Update error:', error);
        });
      }
    });
  }

  openDeleteModal(item: Item) {
    this.selectedItem = item;
  }

  deleteItem(): void {
    if (!this.selectedItem.id) {
      this.displayAddError = 'Item ID is missing.';
      this.clearErrorMessageAfterDelay();
      return;
    }

    this.firestoreService.deleteItemById(this.selectedItem.id).then(() => {
      // Remove from local list
      this.addedItem = this.addedItem.filter(item => item.id !== this.selectedItem.id);
      this.displayAddError = 'Deleted Successfully';
      this.clearErrorMessageAfterDelay();
      // Close modal
      const modalEl = document.getElementById('deleteModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      }
    }).catch(error => {
      this.displayAddError = 'Failed to delete item.';
      this.clearErrorMessageAfterDelay();
      console.error('Delete error:', error);
    });
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

  alertSuccess(): boolean {
    return this.displayAddError === 'Updated Successfully';
  }
  
  alertDanger(): boolean {
    const dangerMessages = new Set([
      'Failed to update item. Please try again',
      'Item ID is missing',
      'Both Word and Meaning are required',
      'Word already exists',
      'Failed to add item. Please try again',
      'Another entry with this word already exists',
      'Item ID is missing for update',
      'Deleted Successfully',
      'Failed to delete item'
    ]);
    return dangerMessages.has(this.displayAddError ?? '');
  }
  
  clearErrorMessageAfterDelay(): void {
    setTimeout(() => {
      this.displayAddError = null;
    }, 2000);
  }

  filterItems() {
    this.filteredItems = this.items.filter(item =>
      item.word.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
