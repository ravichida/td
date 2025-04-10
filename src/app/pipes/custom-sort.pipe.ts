import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customSort',
  standalone: true,  // Use standalone mode
})
export class CustomSortPipe implements PipeTransform {
  transform(items: any[], field: string, order: 'asc' | 'desc'): any[] {
    return items.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (valA == null || valB == null) return 0;
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }
}