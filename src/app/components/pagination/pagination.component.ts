import { CommonModule, NgFor } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, query, orderBy, limit, startAfter, startAt, getDocs, DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  imports: [NgFor], // Add any other components or modules you need to import here
  standalone: true // Set to true if this component is standalone
})

export class PaginationComponent implements OnInit {

  firestore = inject(Firestore);

  items: any[] = [];
  pageSize = 10;
  currentPage = 1;

  nextPageCursors: QueryDocumentSnapshot<DocumentData>[] = [];
  prevPageCursors: QueryDocumentSnapshot<DocumentData>[] = [];

  hasNextPage = true;
  hasPreviousPage = false;

  ngOnInit() {
    this.loadData(true, true);  // true for first load
  }

  async loadData(forward: boolean = true, isFirstLoad: boolean = false): Promise<void>{
    const colRef = collection(this.firestore, 'dictionary');

    let q;

    if (isFirstLoad) {
      q = query(colRef, orderBy('word'), limit(this.pageSize));
      this.currentPage = 1;
    }
    else if (forward) {
      const lastVisible = this.nextPageCursors[this.currentPage - 1];
      if (!lastVisible) return;
      q = query(colRef, orderBy('word'), startAfter(lastVisible), limit(this.pageSize));
    }
    else {
      const prevCursor = this.prevPageCursors[this.currentPage - 2];
      if (!prevCursor) {
        // Reset to first page
        this.currentPage = 1;
        this.nextPageCursors = [];
        this.prevPageCursors = [];
        return this.loadData(true, true);
      }
      q = query(colRef, orderBy('word'), startAt(prevCursor), limit(this.pageSize));
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
    else {
      this.currentPage = Math.max(1, this.currentPage - 1);
    }

    this.hasNextPage = snapshot.docs.length === this.pageSize;
    this.hasPreviousPage = this.currentPage > 1;
  }
}