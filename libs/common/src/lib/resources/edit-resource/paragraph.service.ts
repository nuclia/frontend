import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import {
  getConversationParagraphs,
  getParagraphs,
  getParagraphsWithClassifications,
  ParagraphWithText,
} from './edit-resource.helpers';
import { FieldId, longToShortFieldType, Message, Paragraph, Resource, Search } from '@nuclia/core';
import { cloneDeep } from '@flaps/core';

@Injectable({
  providedIn: 'root',
})
export class ParagraphService {
  protected _paragraphsBackup: BehaviorSubject<ParagraphWithText[]> = new BehaviorSubject<ParagraphWithText[]>([]);
  protected _allParagraphs: BehaviorSubject<ParagraphWithText[]> = new BehaviorSubject<ParagraphWithText[]>([]);
  protected _paragraphLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  protected _searchResults: BehaviorSubject<Search.Results | null> = new BehaviorSubject<Search.Results | null>(null);

  paragraphList: Observable<ParagraphWithText[]> = combineLatest([
    this._allParagraphs.asObservable(),
    this._searchResults.asObservable(),
  ]).pipe(
    map(([allParagraphs, searchResults]) => {
      if (!searchResults || !searchResults.paragraphs?.results) {
        return allParagraphs;
      }
      return allParagraphs
        .map((paragraph) => ({
          paragraph,
          score:
            searchResults.paragraphs?.results.find(
              (res) => paragraph.start === res.position?.start && paragraph.end === res.position?.end,
            )?.score || 0,
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ paragraph }) => paragraph);
    }),
  );
  hasParagraph: Observable<boolean> = combineLatest([this._allParagraphs, this._paragraphLoaded]).pipe(
    map(([paragraphs, loaded]) => !loaded || paragraphs.length > 0),
  );
  paragraphLoaded: Observable<boolean> = this._paragraphLoaded.asObservable();

  initParagraphs(fieldId: FieldId, resource: Resource, messages?: Message[]) {
    const paragraphs: Paragraph[] = messages
      ? getConversationParagraphs(fieldId, resource, messages)
      : getParagraphs(fieldId, resource);
    const enhancedParagraphs = getParagraphsWithClassifications(paragraphs, fieldId, resource).filter(
      (paragraph) => !(paragraph.kind === 'OCR' && !paragraph.text),
    );
    this.setupParagraphs(enhancedParagraphs);
  }

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
    this._paragraphLoaded.next(false);
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

  searchInField(
    query: string,
    resource: Resource,
    field: FieldId,
    extendedResults = false,
  ): Observable<Search.Results> {
    return resource
      .search(query, [Search.ResourceFeatures.KEYWORD], {
        fields: [`${longToShortFieldType(field.field_type)}/${field.field_id}`],
        top_k: extendedResults ? 200 : 20,
      })
      .pipe(map((res) => (res.type === 'error' ? { type: 'searchResults' } : res)));
  }

  setupParagraphs(paragraphs: ParagraphWithText[]) {
    this._paragraphsBackup.next(paragraphs);
    this._allParagraphs.next(cloneDeep(paragraphs));
    this._paragraphLoaded.next(true);
  }
}
