import { Component } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, updateDoc, documentId } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Item } from '../../item.model';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent {
  wordId: string | null = null;
  public items$: Observable<Item[]>;
  public items: Item[] = [];
  public selectedItem: any = { id: '', word: '', meaning: '' };

  constructor(private firestore: Firestore, private route: ActivatedRoute, private firestoreService: FirestoreService, private router: Router) {
    const itemsCollection = collection(this.firestore, 'dictionary');
      this.items$ = collectionData(itemsCollection, { idField: 'id' }) as Observable<Item[]>;
    this.route.paramMap.subscribe((params) => {
      this.wordId = params.get('wordId');
    });
  }

  ngOnInit() {
    this.fetchItems();
  }

  fetchItems() {
    this.items$ = this.firestoreService.getItems(); // Fetch latest data
    this.items$.subscribe(data => {
    this.items = data;
    console.log(data);
    this.selectedItem = this.items.find(item => item.id === this.wordId);
    console.log(this.selectedItem);

    })
  }

  goHome() {
    this.router.navigate(['/']); // ✅ Redirect to home page
  }
}
