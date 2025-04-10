import { Component, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, documentId } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Item } from '../../item.model';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule, NgFor, NgForOf } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { Router, RouterLink } from '@angular/router';
import { CustomSortPipe } from '../../pipes/custom-sort.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgForOf, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
    public displayAddError = "";
    private firestoreService = inject(FirestoreService);
    public items$: Observable<Item[]>;
    public selectedItem: Item = { id: '', word: '', meaning: '' };
    // public filteredItems: Item[] = []; // without pagination
    public sortedItems: Item[] = [];
    public sortOrder: boolean = false;
    
    // pagination
    items: any[] = []; // Full dictionary data
    filteredItems: any[] = []; // Search result
    paginatedItemsList: any[] = []; // Displayed items
    public searchTerm: string = '';
    currentPage:number = 1;
    itemsPerPage: number = 5;
    // filteredItems = [...this.items]; // Initialize with all items

  
    constructor(private firestore: Firestore, private router: Router) {
      const itemsCollection = collection(this.firestore, 'dictionary');
      this.items$ = collectionData(itemsCollection, { idField: 'id' }) as Observable<Item[]>;
      this.filterItems(); // Ensure initial filtering fro pagination
    }
  
    /* constructor() {
      this.firestoreService.getItems().subscribe(data => {
        this.items = data;
        console.log(this.items);
      });
    } */
  
    ngOnInit() {
      this.fetchItems();
      console.log("ngOnInit paginatedItemsList", this.paginatedItemsList.length);
      console.log("ngOnInit this.filteredItems", this.filteredItems.length);
    }
  
    fetchItems() {
      this.items$ = this.firestoreService.getItems(); // Fetch latest data
      this.items$.subscribe(data => {
        this.items = data;
        console.log(data);
        this.filterItems();
        this.paginatedItems() // Update paginated items
      })

      // pagination code starts here
      /* this.filteredItems = this.items.filter((item) =>
        item.word.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.currentPage = 1; // Reset to first page after filtering */

    // this.filteredItems = [...this.items]; // Initialize with all items
    this.filteredItems = []; // Initialize with all items
    this.filterItems()

      // pagination code ends here
    }
  
  
    filterItems() {
      this.filteredItems = this.items.filter(item =>
        item.word.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.sortedItems = new CustomSortPipe().transform(this.filteredItems, 'word', this.sortOrder ? 'desc' : 'asc');
          console.log(this.sortedItems);
      this.currentPage = 1; // Reset to first page
    }

    toggleSortOrder() {
      this.sortOrder = !this.sortOrder;
      this.filterItems();
    }
  
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      console.log("start", start);
      console.log("end", end);
      console.log("this.filteredItems", this.filteredItems);
      this.paginatedItemsList = this.filteredItems.slice(start, end);
      console.log("paginatedItemsList", this.paginatedItemsList);
    }
  
    changePage(page: number) {
      this.currentPage = page;
      this.paginatedItems();
    }

    viewDetails(id: string) {
      this.router.navigate(['/details', id]); // ✅ Navigate to details page
    }

    // Pagination methods starts here
    // some part of pagination code there in filterItems()
  
    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage);
    }

    // Pagination methods ends here


}
