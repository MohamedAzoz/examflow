import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cut'
})
export class CutPipe implements PipeTransform {

  transform(value: string | null | undefined, length: number): string {
    if (!value) {
      return '';
    }
    return value.length > length ? value.slice(0, length) + '...' : value;
  }

}