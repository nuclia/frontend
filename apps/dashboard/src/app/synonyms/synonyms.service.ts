import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, Observable, switchMap, take } from 'rxjs';
import { Synonyms } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';

@Injectable({
  providedIn: 'root',
})
export class SynonymsService {
  private _synonyms: BehaviorSubject<Synonyms> = new BehaviorSubject<Synonyms>({});

  synonyms: Observable<Synonyms> = this._synonyms.asObservable();

  constructor(private sdk: SDKService, private toast: SisToastService) {}

  loadSynonyms() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getSynonyms()),
      )
      .subscribe((synonyms) => this._synonyms.next(synonyms));
  }

  isUnique(mainWord: string): boolean {
    return !this._synonyms.getValue()[mainWord];
  }

  addSynonym(mainWord: string, synonyms: string) {
    if (!this.isUnique(mainWord)) {
      this.toast.error(`"${mainWord}" already exists as a synonym entry`);
      return;
    }
    const updatedSynonyms = this._synonyms.getValue();
    updatedSynonyms[mainWord] = this.getSynonymsFromString(synonyms);
    this.updateAndRefreshSynonyms(updatedSynonyms);
  }

  editSynonym(mainWord: string, synonyms: string) {
    const updatedSynonyms = this._synonyms.getValue();
    updatedSynonyms[mainWord] = this.getSynonymsFromString(synonyms);
    this.updateAndRefreshSynonyms(updatedSynonyms);
  }

  deleteSynonym(mainWord: string) {
    const updatedSynonyms = this._synonyms.getValue();
    delete updatedSynonyms[mainWord];
    this.updateAndRefreshSynonyms(updatedSynonyms);
  }

  private updateAndRefreshSynonyms(updatedSynonyms: Synonyms) {
    return this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.setSynonyms(updatedSynonyms)),
      )
      .subscribe({
        complete: () => this._synonyms.next(updatedSynonyms),
        error: () => this.toast.error('An error occurred while updating synonyms'),
      });
  }

  private getSynonymsFromString(synonyms: string): string[] {
    return synonyms.split(',').map((synonym) => synonym.trim());
  }
}
