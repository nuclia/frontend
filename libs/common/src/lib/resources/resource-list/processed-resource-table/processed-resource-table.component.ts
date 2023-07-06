import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ColoredLabel, ColumnHeader, DEFAULT_PREFERENCES, RESOURCE_LIST_PREFERENCES } from '../resource-list.model';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, of, skip, Subject, take, tap } from 'rxjs';
import { HeaderCell, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { Classification, LabelSets, Resource, Search } from '@nuclia/core';
import { LabelsService } from '@flaps/common';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { ResourcesTableDirective } from '../resources-table.directive';
import mime from 'mime';

interface Filters {
  classification: OptionModel[];
  mainTypes: OptionModel[];
}

@Component({
  selector: 'stf-processed-resource-table',
  templateUrl: './processed-resource-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessedResourceTableComponent extends ResourcesTableDirective implements OnInit, OnDestroy, OnChanges {
  @Input()
  set labelSets(value: LabelSets | undefined | null) {
    if (value) {
      this._labelSets = value;
    }
  }
  get labelSets(): LabelSets {
    return this._labelSets;
  }

  @Output() addLabels: EventEmitter<{ resources: Resource[]; labels: Classification[] }> = new EventEmitter();
  @Output() removeLabel: EventEmitter<{ resource: Resource; labelToRemove: ColoredLabel }> = new EventEmitter();
  @Output() filter: EventEmitter<string[]> = new EventEmitter();

  private _labelSets: LabelSets = {};

  get initialColumns(): ColumnHeader[] {
    return [
      { id: 'title', label: 'resource.title', size: '3fr', sortable: false, visible: true },
      {
        id: 'classification',
        label: 'resource.classification-column',
        size: 'minmax(304px, 1fr)',
        optional: true,
        visible: this.userPreferences.columns.includes('classification'),
      },
      {
        id: 'created',
        label: 'generic.date',
        size: '128px',
        sortable: true,
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('created'),
      },
      {
        id: 'language',
        label: 'generic.language',
        size: '112px',
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('language'),
      },
    ];
  }
  userPreferences: typeof DEFAULT_PREFERENCES;

  // Set in constructor depending on user preferences
  protected override defaultColumns: ColumnHeader[];
  optionalColumns: ColumnHeader[];
  columnVisibilityUpdate: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  hasLabelSets = inject(LabelsService).hasLabelSets();
  currentLabelList: Classification[] = [];
  deletingLabel = false;

  private _visibleColumnDef: Observable<ColumnHeader[]> = combineLatest([
    this.isAdminOrContrib,
    this.columnVisibilityUpdate,
  ]).pipe(
    map(([canEdit]) => {
      const visibleColumns = this.defaultColumns.map(this.getApplySortingMapper()).filter((column) => column.visible);
      return canEdit
        ? [...visibleColumns, { id: 'menu', label: 'generic.actions', size: '96px' }]
        : [...visibleColumns];
    }),
  );
  override headerCells: Observable<HeaderCell[]> = this._visibleColumnDef.pipe(
    map((cells) => cells.map((cell) => new HeaderCell(cell))),
  );
  visibleColumnsId: Observable<string[]> = this._visibleColumnDef.pipe(map((cells) => cells.map((cell) => cell.id)));
  override tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this._visibleColumnDef]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );

  hasFilters = false;
  isFiltering = false;
  filterOptions: Filters = {
    classification: [],
    mainTypes: [],
  };

  unsubscribeAll = new Subject<void>();

  private localStorage = inject(LOCAL_STORAGE);

  constructor(private cdr: ChangeDetectorRef) {
    super();
    const pref = this.localStorage.getItem(RESOURCE_LIST_PREFERENCES);
    if (pref) {
      try {
        this.userPreferences = JSON.parse(pref);
      } catch (e) {
        this.userPreferences = DEFAULT_PREFERENCES;
        this.localStorage.setItem(RESOURCE_LIST_PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      }
    } else {
      this.userPreferences = DEFAULT_PREFERENCES;
    }
    this.defaultColumns = this.initialColumns;
    this.optionalColumns = this.defaultColumns.filter((column) => column.optional);
  }

  ngOnInit() {
    this.columnVisibilityUpdate.pipe(skip(1), takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.userPreferences.columns = this.defaultColumns
        .map((column) => (column.optional && column.visible ? column.id : ''))
        .filter((value) => !!value);
      this.localStorage.setItem(RESOURCE_LIST_PREFERENCES, JSON.stringify(this.userPreferences));
    });

    this.loadFilters();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].isFirstChange()) {
      this.deletingLabel = false;
    }
  }

  onRemoveLabel(
    resource: Resource,
    labelToRemove: ColoredLabel,
    $event: { event: MouseEvent | KeyboardEvent; value: any },
  ) {
    this.deletingLabel = true;
    $event.event.stopPropagation();
    $event.event.preventDefault();
    this.removeLabel.emit({ resource, labelToRemove });
  }

  updateLabelList(list: Classification[]) {
    this.currentLabelList = list;
  }

  addLabelsToSelection() {
    const resources = this.getSelectedResources();
    this.addLabels.emit({ labels: this.currentLabelList, resources });
    this.currentLabelList = [];
  }

  selectColumn(column: ColumnHeader, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      column.visible = !column.visible;
      this.columnVisibilityUpdate.next(!column.visible);
    }
  }

  onToggleFilter() {
    const filters = this.selectedFilters;
    this.filter.emit(filters);
    this.isFiltering = filters.length > 0;
  }

  onSelectFilter(option: OptionModel, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      option.selected = !option.selected;
      this.onToggleFilter();
    }
  }

  clearFilters() {
    this.filter.emit([]);
    this.isFiltering = false;
    this.filterOptions.classification.forEach((option) => (option.selected = false));
    this.filterOptions.mainTypes.forEach((option) => (option.selected = false));
  }

  get selectedFilters(): string[] {
    return this.getSelectionFor('classification').concat(this.getSelectionFor('mainTypes'));
  }

  private getSelectionFor(type: 'classification' | 'mainTypes') {
    return this.filterOptions[type].filter((option) => option.selected).map((option) => option.value);
  }

  private loadFilters() {
    const mimeFacetFamily = '/n/i';
    const faceted = [mimeFacetFamily].concat(Object.keys(this._labelSets).map((setId) => `/l/${setId}`));
    let allFacets: Search.FacetsResult;
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.catalog('', { faceted }).pipe(
            switchMap((results) => {
              if (results.type === 'error') {
                return of(results);
              }
              const facetsResult = results.fulltext?.facets || {};
              // Store all facets but mimetype ones
              allFacets = Object.entries(facetsResult).reduce((facets, [key, value]) => {
                if (key !== mimeFacetFamily) {
                  facets[key] = value;
                }
                return facets;
              }, {} as Search.FacetsResult);
              const mimeFaceted = Object.keys(facetsResult[mimeFacetFamily]);
              return kb.catalog('', { faceted: mimeFaceted });
            }),
          ),
        ),
        tap((results) => {
          if (results.type !== 'error') {
            allFacets = { ...allFacets, ...(results.fulltext?.facets || {}) };
          }
        }),
      )
      .subscribe(() => this.formatFiltersFromFacets(allFacets));
  }

  private formatFiltersFromFacets(allFacets: Search.FacetsResult) {
    // Group facets by types
    const facetGroups: {
      classification: { key: string; count: number }[];
      mainTypes: { key: string; count: number }[];
    } = Object.entries(allFacets).reduce(
      (groups, [facetId, values]) => {
        if (facetId.startsWith('/l/')) {
          Object.entries(values).forEach(([key, count]) => {
            groups.classification.push({ key, count });
          });
        } else if (facetId.startsWith('/n/i/')) {
          Object.entries(values).forEach(([key, count]) => {
            groups.mainTypes.push({ key, count });
          });
        }
        return groups;
      },
      {
        classification: [] as { key: string; count: number }[],
        mainTypes: [] as { key: string; count: number }[],
      },
    );

    // Create corresponding filter options
    const filters: Filters = {
      classification: [],
      mainTypes: [],
    };
    if (facetGroups.classification.length > 0) {
      facetGroups.classification.forEach((facet) =>
        filters.classification.push(this.getOptionFromFacet(facet, facet.key.substring(3))),
      );
      filters.classification.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (facetGroups.mainTypes.length > 0) {
      facetGroups.mainTypes.forEach((facet) => {
        let help: string | undefined = facet.key.substring(5);
        let label = mime.getExtension(help) || (facet.key.split('/').pop() as string);
        if (label === 'stf-link') {
          label = 'link';
        }
        if (help.includes('.')) {
          help = help.split('.').pop();
        }
        return filters.mainTypes.push(this.getOptionFromFacet(facet, label, help));
      });
      filters.mainTypes.sort((a, b) => a.label.localeCompare(b.label));
    }

    this.filterOptions = filters;
    this.hasFilters = filters.classification.length > 0 || filters.mainTypes.length > 0;
    this.cdr.markForCheck();
  }

  private getOptionFromFacet(facet: { key: string; count: number }, label: string, help?: string): OptionModel {
    return new OptionModel({
      id: facet.key,
      value: facet.key,
      label: `${label} (${facet.count})`,
      help,
    });
  }
}
