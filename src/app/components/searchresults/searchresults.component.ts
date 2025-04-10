import { Component, OnInit, ViewChild, inject, Injector, NgZone } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy, limit, startAfter } from '@angular/fire/firestore';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';

interface DictionaryEntry {
  id?: string;
  word: string;
  meaning: string;
}

@Component({
  selector: 'app-searchresults',
  templateUrl: './searchresults.component.html',
  styleUrl: './searchresults.component.css',
  standalone: true, // ✅ Important for standalone components
  imports: [CommonModule, MatTableModule, MatPaginatorModule], // ✅ Add Material Table & Paginator
  //encapsulation: ViewEncapsulation.None // ✅ disables style isolation
})
export class SearchresultsComponent implements OnInit {
  displayedColumns: string[] = ['word', 'meaning'];
  dataSource = new MatTableDataSource<DictionaryEntry>([]);
  totalResults = 0;
  pageSize = 10;
  pageIndex = 0;
  lastDoc: any = null;
  lastVisibleDocs: any[] = []; // stores document snapshot for each page


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private firestore = inject(Firestore);
  private ngZone = inject(NgZone); // ✅ Inject Angular Zone

  ngOnInit() {
    this.fetchTotalCount();
    this.loadResults();
  }

  /** ✅ Fetch Total Document Count */
  fetchTotalCount() {
    this.ngZone.run(async () => {  // ✅ Runs inside Angular context
      const dictionaryRef = collection(this.firestore, 'dictionary');
      const totalSnapshot = await getDocs(query(dictionaryRef));
      this.totalResults = totalSnapshot.size; // ✅ Set total results
    });
  }

  /** ✅ Load Paginated Data */
  loadResults() {
    this.ngZone.run(async () => {
      const dictionaryRef = collection(this.firestore, 'dictionary');
  
      let q = query(dictionaryRef, orderBy('word'), limit(this.pageSize));
  
      // Go forward
      if (this.pageIndex > 0 && this.lastVisibleDocs[this.pageIndex - 1]) {
        q = query(dictionaryRef, orderBy('word'), startAfter(this.lastVisibleDocs[this.pageIndex - 1]), limit(this.pageSize));
      }
  
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        this.lastVisibleDocs[this.pageIndex] = docs[docs.length - 1]; // ✅ cache last doc of this page
        const results = docs.map(doc => doc.data() as DictionaryEntry);
        this.dataSource.data = results;
      }
    });
  }
  

  /** ✅ Handle Page Change */
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadResults();
    console.log('Page changed:', this.pageIndex, "page size", this.pageSize);
  }
  

}
