import { CommonModule, NgFor } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, startAt, where, getDocs, DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],
  imports: [NgFor], // Add any other components or modules you need to import here
  standalone: true // Set to true if this component is standalone
})
export class IndexComponent implements OnInit {

  firestore = inject(Firestore);

  items: any[] = [];
  pageSize = 10;
  currentPage = 1;

  nextPageCursors: QueryDocumentSnapshot<DocumentData>[] = [];
  prevPageCursors: QueryDocumentSnapshot<DocumentData>[] = [];

  hasNextPage = true;
  hasPreviousPage = false;

  alphabetList: string[] = Array.from(Array(26)).map((_, i) => String.fromCharCode(65 + i));
  selectedLetter: string = 'A'; // Default selected A

  ngOnInit() {
    this.loadData(true, true); // Load first page on load
  }

  async loadData(forward: boolean = true, isFirstLoad: boolean = false): Promise<void> {
    const colRef = collection(this.firestore, 'dictionary');

    let q;

    if (isFirstLoad) {
      q = query(
        colRef,
        orderBy('word'),
        where('word', '>=', this.selectedLetter),
        where('word', '<', this.getNextLetter(this.selectedLetter)),
        limit(this.pageSize)
      );
      this.currentPage = 1;
    } 
    else if (forward) {
      const lastVisible = this.nextPageCursors[this.currentPage - 1];
      if (!lastVisible) return;
      q = query(
        colRef,
        orderBy('word'),
        where('word', '>=', this.selectedLetter),
        where('word', '<', this.getNextLetter(this.selectedLetter)),
        startAfter(lastVisible),
        limit(this.pageSize)
      );
    } 
    else {
      const prevCursor = this.prevPageCursors[this.currentPage - 2];
      if (!prevCursor) {
        return this.loadData(true, true); // Reset to first page
      }
      q = query(
        colRef,
        orderBy('word'),
        where('word', '>=', this.selectedLetter),
        where('word', '<', this.getNextLetter(this.selectedLetter)),
        startAt(prevCursor),
        limit(this.pageSize)
      );
      this.currentPage = Math.max(1, this.currentPage - 1);
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      this.hasNextPage = false;
      return;
    }

    this.items = snapshot.docs.map(doc => doc.data());

    const firstVisible = snapshot.docs[0];
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    if (isFirstLoad) {
      this.nextPageCursors = [lastVisible];
      this.prevPageCursors = [firstVisible];
      this.currentPage = 1;
    } 
    else if (forward) {
      this.currentPage++;
      this.nextPageCursors.push(lastVisible);
      this.prevPageCursors.push(firstVisible);
    }

    this.hasNextPage = snapshot.docs.length === this.pageSize;
    this.hasPreviousPage = this.currentPage > 1;
  }

  filterByLetter(letter: string) {
    this.selectedLetter = letter.toUpperCase();
  
    // Clear existing data and pagination state
    this.items = [];
    this.nextPageCursors = [];
    this.prevPageCursors = [];
    this.currentPage = 1;
    this.hasNextPage = true;
    this.hasPreviousPage = false;
  
    // Load first page for selected letter
    this.loadData(true, true);
  }  

  getNextLetter(letter: string): string {
    return String.fromCharCode(letter.charCodeAt(0) + 1);
  }
}
