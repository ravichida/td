import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform(items: any[], field: string, order: 'asc' | 'desc'): any[] {
    return items.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (valA == null || valB == null) return 0;
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

}
