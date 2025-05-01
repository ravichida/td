// ✅ Updated search.component.ts with search, pagination, sorting, update/delete functionality

import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
// import * as bootstrap from 'bootstrap'; // Import Bootstrap for modal functionality
import { FormsModule } from '@angular/forms';

declare var bootstrap: any; // Ensure Bootstrap modal functions work

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  imports: [FormsModule, CommonModule, NgFor, NgForOf],
  standalone: true,
})
export class SearchComponent implements OnInit {
  searchTerm: string = '';
  allItems: any[] = [];
  sortedItems: any[] = [];
  selectedItem: any = {};
  displayAddError: string | null = null;
  sortAscending: boolean = true;
  displayedItems: any[] = [];
  paginationEnabled: boolean = false; // Enable pagination

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  itemsPerPageOptions: number[] = [5, 10, 20, 50]; // Options for items per page
  itemsPerPageSelected: number = this.itemsPerPageOptions[0]; // Default to first option

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.loadAllItems();
  }

  /* ngOnInit(): void {
    this.loadItems();
  } */
  

  loadAllItems(): void {
    this.firestoreService.getAllItems().then(items => {
      console.log('Loaded items:', items);
      /* // concat 10 times to make it 100 items ton test pagination
      this.allItems = this.allItems.concat(items, items, items, items, items, items, items, items, items, items)
      this.applyFilters(); */
      this.allItems = items;
    });
  }

  loadItems(): void {
    this.firestoreService.getAllItems().then(items => {
      console.log('Loaded items:', items);
      /* // concat 10 times to make it 100 items
      items.sort((a, b) => a.word.localeCompare(b.word));
      this.sortedItems = this.sortedItems.concat(items, items, items, items, items, items, items, items, items, items)
      this.allItems = this.sortedItems; */
      this.sortedItems = items;
    });
  }
  

  applyFilters(): void {
    let filtered = this.allItems;
  
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toUpperCase();
      filtered = filtered.filter(item =>
        (item.word ?? '').toUpperCase().includes(term)
      );
    }
  
    this.sortedItems = this.sortAscending
      ? filtered.sort((a, b) => a.word.localeCompare(b.word))
      : filtered.sort((a, b) => b.word.localeCompare(a.word));
  
    // ✅ Set totalPages correctly based on filtered results
    if (this.sortedItems.length === 0) {
      this.totalPages = 0;
      this.currentPage = 0;
    } else {
      this.totalPages = Math.ceil(this.sortedItems.length / this.itemsPerPage);
      this.currentPage = 1;
    }
  
    this.paginate();
  }
  
  
  
  

  paginate(): void {
    if (this.sortedItems.length === 0) {
      this.displayedItems = [];
      this.totalPages = 0;
      return;
    }
  
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedItems = this.sortedItems.slice(start, end);
    this.paginationEnabled = true; // Enable pagination if items are present
  
    this.totalPages = Math.ceil(this.sortedItems.length / this.itemsPerPage);
    console.log('Total pages:', this.totalPages);
    console.log("Displayed items:", this.displayedItems);
  }
  

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 10;
  
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
  
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
  
    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }
  
    return pages;
  }
  
  
    

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginate();
    }
  }  

  toggleSortOrder(): void {
    this.sortAscending = !this.sortAscending;
    this.applyFilters();
  }

  convertToTitleCase(word: string | undefined): string {
    if (!word) return '';
    return word
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  openUpdateModal(item: any): void {
    this.selectedItem = { ...item };
  }

  openDeleteModal(item: any): void {
    this.selectedItem = { ...item };
  }

  clearErrorMessageAfterDelay(): void {
    setTimeout(() => {
      this.displayAddError = null;
    }, 2000);
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
        item['word'].toUpperCase() === trimmedWord && item['id'] !== this.selectedItem.id
      );

      if (conflict) {
        this.displayAddError = 'Another entry with this word already exists';
        this.clearErrorMessageAfterDelay();
      } else {
        const updatedData = {
          word: trimmedWord,
          meaning: trimmedMeaning
        };

        this.firestoreService.updateItemAndFetch(this.selectedItem.id, updatedData).then(updatedDoc => {
          const index = this.allItems.findIndex(item => item.id === updatedDoc.id);
          if (index !== -1) {
            this.allItems[index] = updatedDoc;
          }

          this.displayAddError = 'Updated Successfully';
          this.clearErrorMessageAfterDelay();

          const modalEl = document.getElementById('updateModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.hide();
          }

          this.applyFilters();
        }).catch(() => {
          this.displayAddError = 'Failed to update item. Please try again';
          this.clearErrorMessageAfterDelay();
        });
      }
    });
  }

  deleteItem(): void {
    if (!this.selectedItem.id) {
      this.displayAddError = 'Item ID is missing';
      this.clearErrorMessageAfterDelay();
      return;
    }

    this.firestoreService.deleteItemById(this.selectedItem.id).then(() => {
      this.allItems = this.allItems.filter(item => item.id !== this.selectedItem.id);
      this.displayAddError = 'Deleted Successfully';
      this.clearErrorMessageAfterDelay();

      const modalEl = document.getElementById('deleteModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.hide();
      }


      this.applyFilters();
    }).catch(() => {
      this.displayAddError = 'Failed to delete item';
      this.clearErrorMessageAfterDelay();
    });
  }
}
