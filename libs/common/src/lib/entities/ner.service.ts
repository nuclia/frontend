import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { EntitiesGroup, IKnowledgeBox } from '@nuclia/core';
import { getNerFamilyTitle, NerFamily } from '@flaps/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class NerService {
  private entitiesSubject = new BehaviorSubject<{ [key: string]: NerFamily } | null>(null);

  entities = this.entitiesSubject.asObservable();

  constructor(
    private sdk: SDKService,
    private translate: TranslateService,
  ) {
    this.sdk.currentKb
      .pipe(
        tap(() => {
          this.entitiesSubject.next(null);
        }),
        filter((kb) => !!kb),
        switchMap((kb) => kb.getEntities()),
      )
      .subscribe({
        next: (entities) => {
          this.entitiesSubject.next(
            Object.entries(entities)
              .map(([familyKey, family]) => ({
                ...family,
                key: familyKey,
                entities: undefined, // TODO: this line can be removed once getEntities method does not return "entities" property
              }))
              .reduce((acc, family) => ({ ...acc, [family.key]: family }), {}),
          );
        },
        error: () => this.entitiesSubject.next(null),
      });
  }

  getNerFamilyWithTitles(entities: { [key: string]: NerFamily }): NerFamily[] {
    return Object.entries(entities)
      .map(([familyKey, family]) => ({
        ...family,
        title: getNerFamilyTitle(familyKey, family, this.translate),
      }))
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  refreshFamily(familyId: string): Observable<EntitiesGroup> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => this._refreshFamily(kb, familyId)),
    );
  }

  private _refreshFamily(kb: IKnowledgeBox, familyId: string): Observable<EntitiesGroup> {
    return kb.getEntitiesGroup(familyId).pipe(
      catchError(() => {
        return EMPTY;
      }),
      tap((family) => {
        this.entitiesSubject.next({
          ...this.entitiesSubject.getValue(),
          [familyId]: { ...family, key: familyId, title: family.title || '' },
        });
      }),
    );
  }
}
