import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { filter, map, takeUntil, shareReplay } from 'rxjs/operators';
import Fuse from 'fuse.js'
import { Entities, EntitiesGroup } from '@nuclia/core';
import { EntitiesService } from '../services/entities.service';
import { AppEntitiesGroup, MutableEntitiesGroup } from './model';
import { EntitiesEditService } from './entities-edit.service';

type SearchResutls = { [key: string]: string[] };

@Injectable()
export class EntitiesSearchService implements OnDestroy {

  private runSearch = new Subject<string>();
  private unsubscribeAll = new Subject<void>();

  private searchResults = combineLatest([
    this.runSearch,
    this.entitiesService.getEntities().pipe(
      filter((value): value is Entities => !!value),
    ),
    this.editService.getGroups()
  ]).pipe(
    takeUntil(this.unsubscribeAll),
    map(([searchTerm, groups, editableGroups]) => this.generateResults(searchTerm, groups, editableGroups)),
    shareReplay(1)
  );

  constructor(private entitiesService: EntitiesService, private editService: EntitiesEditService) {}
  
  search(searchTerm: string): void {
    this.runSearch.next(searchTerm);
  }

  getSearchTerm(): Observable<string> {
    return this.runSearch.asObservable();
  }

  hasNoResults(): Observable<boolean> {
    return this.searchResults.pipe(
      map((results) => (
        Object.keys(results).length > 0 &&
        Object.keys(results).every((key) => results[key].length === 0)
      ))
    );
  }

  getSearchResults(groupKey: string): Observable<string[] | null> {
    return this.searchResults.pipe(
      map((groups) => groups[groupKey] || null)
    );
  }

  private generateResults(
    searchTerm: string,
    groups: { [key: string]: EntitiesGroup },
    editableGroups: { [key: string]: MutableEntitiesGroup }
  ): SearchResutls {
    if (searchTerm.length === 0) return {};
    return Object.entries(groups).reduce((all: SearchResutls, [key, group]) => {
      all[key] = this.fuzzySearch(searchTerm, editableGroups[key] || new AppEntitiesGroup(group, key));
      return all;
    }, {});
  }
  
  private fuzzySearch(searchTerm: string, group: AppEntitiesGroup): string[] {
    const list = group.getEntityList().filter(entity => !entity.merged);
    const options = {
      keys: ['value'],
      minMatchCharLength: 3,
      ignoreLocation: true,
      threshold: 0.2,
    };
    const fuse = new Fuse(list, options);
    return fuse.search(searchTerm).map((entity) => entity.value);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}