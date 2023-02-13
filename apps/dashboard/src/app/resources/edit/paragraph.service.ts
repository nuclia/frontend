import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ParagraphWithText } from './edit-resource.helpers';
import { Search } from '@nuclia/core';
import { cloneDeep } from '@flaps/common';

@Injectable({
  providedIn: 'root',
})
export class ParagraphService {
  protected _paragraphsBackup: BehaviorSubject<ParagraphWithText[]> = new BehaviorSubject<ParagraphWithText[]>([]);
  protected _allParagraphs: BehaviorSubject<ParagraphWithText[]> = new BehaviorSubject<ParagraphWithText[]>([]);
  protected _searchResults: BehaviorSubject<Search.Results | null> = new BehaviorSubject<Search.Results | null>(null);
  protected _paragraphList: Observable<ParagraphWithText[]> = combineLatest([
    this._allParagraphs.asObservable(),
    this._searchResults.asObservable(),
  ]).pipe(
    map(([allParagraphs, searchResults]) => {
      if (!searchResults || !searchResults.paragraphs?.results) {
        return allParagraphs;
      }
      return allParagraphs.filter(
        (paragraph) =>
          !!searchResults.paragraphs?.results.find(
            (res) => paragraph.start === res.position?.start && paragraph.end === res.position?.end,
          ),
      );
    }),
  );

  hasModifications(): boolean {
    return JSON.stringify(this._paragraphsBackup.value) !== JSON.stringify(this._allParagraphs.value);
  }

  resetParagraphs() {
    this._allParagraphs.next(cloneDeep(this._paragraphsBackup.value));
  }

  cleanup() {
    this._paragraphsBackup.next([]);
    this._allParagraphs.next([]);
    this._searchResults.next(null);
  }

  setSearchResults(results: Search.Results | null) {
    this._searchResults.next(results);
  }

  appendSearchResults(results: Search.Results) {
    const currentResults: Search.Results | null = this._searchResults.value;
    if (!currentResults || !currentResults.paragraphs) {
      this._searchResults.next(results);
    } else {
      const paragraphs = (currentResults.paragraphs.results || []).concat(results.paragraphs?.results || []);
      this._searchResults.next({
        ...currentResults,
        paragraphs: {
          ...currentResults.paragraphs,
          results: paragraphs,
        },
      });
    }
  }

  protected _initParagraphs(paragraphs: ParagraphWithText[]) {
    this._paragraphsBackup.next(paragraphs);
    this._allParagraphs.next(cloneDeep(paragraphs));
  }
}
