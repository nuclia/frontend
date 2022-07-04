import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bold',
})
export class BoldPipe implements PipeTransform {
  transform(text: string, search: string, patter: any): string {
    if (!text || !search) {
      return text;
    }

    // allow searching against any word
    const searchRegex = search
      .split(' ')
      .map(escapeRegExp)
      .map((x) => `(\\s|^)${x}`)
      .join('|');

    const regex = new RegExp(searchRegex, 'gi');
    const bolded = text.replace(regex, (match) => `</b>${match}<b>`);

    return `<b>${bolded}</b>`;
  }
}

function escapeRegExp(val: string): string {
  return val.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
