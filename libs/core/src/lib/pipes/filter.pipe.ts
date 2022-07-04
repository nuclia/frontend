import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
  transform(mainArr: any[], searchText: string, property: string): any {
    if (searchText === '') {
      return mainArr;
    }

    searchText = searchText.toLowerCase();

    return mainArr.filter((itemObj) => {
      return this.searchInObj(itemObj, searchText);
    });
  }

  private searchInObj(itemObj: any, searchText: string): boolean {
    for (const prop in itemObj) {
      if (!itemObj.hasOwnProperty(prop)) {
        continue;
      }

      const value = itemObj[prop];

      if (typeof value === 'string') {
        if (this.searchInString(value, searchText)) {
          return true;
        }
      } else if (Array.isArray(value)) {
        if (this.searchInArray(value, searchText)) {
          return true;
        }
      }

      if (typeof value === 'object') {
        if (this.searchInObj(value, searchText)) {
          return true;
        }
      }
    }
    return false;
  }

  private searchInArray(arr: any[], searchText: string): boolean {
    for (const value of arr) {
      if (typeof value === 'string') {
        if (this.searchInString(value, searchText)) {
          return true;
        }
      }

      if (typeof value === 'object') {
        if (this.searchInObj(value, searchText)) {
          return true;
        }
      }
    }
    return false;
  }

  private searchInString(value: string, searchText: string): any {
    return value.toLowerCase().includes(searchText);
  }
}
