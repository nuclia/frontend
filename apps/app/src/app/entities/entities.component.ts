import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Entities } from '@nuclia/core';
import { AppEntitiesGroup } from './model';
import { EntitiesService } from '../services/entities.service';
import { EntitiesEditService } from './entities-edit.service';
import { EntitiesSearchService } from './entities-search.service';

@Component({
  selector: 'app-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  providers: [EntitiesEditService, EntitiesSearchService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntitiesComponent {
  searchInput = new UntypedFormControl('');
  unsubscribeAll = new Subject<void>();
  searchTerm = this.searchService.getSearchTerm();
  noResults = this.searchService.hasNoResults();

  groups = this.entitiesService.getEntities().pipe(
    filter((entities): entities is Entities => !!entities),
    map(entities => (
      Object.entries(entities)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([groupKey, group])=> (new AppEntitiesGroup(group, groupKey))
    )))
  );
  
  constructor(
    private entitiesService: EntitiesService,
    private searchService: EntitiesSearchService,
  ) {}

  search() {
    this.searchService.search(this.searchInput.value)
  }

  trackByFn(index: number, item: AppEntitiesGroup): string {
    return item.key;
  }
}