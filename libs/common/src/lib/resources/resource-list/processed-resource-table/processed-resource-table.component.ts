import {
  ChangeDetectionStrategy,
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
import { map, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, skip, Subject } from 'rxjs';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import { Classification, LabelSets, Resource } from '@nuclia/core';
import { LabelsService } from '@flaps/common';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { ResourcesTableDirective } from '../resources-table.directive';

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

  private _labelSets: LabelSets = {};

  get initialColumns(): ColumnHeader[] {
    return [
      { id: 'title', label: 'resource.title', size: '3fr', sortable: false, visible: true },
      {
        id: 'classification',
        label: 'resource.classification-column',
        size: 'minmax(176px, 1fr)',
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
  protected defaultColumns: ColumnHeader[];
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
  headerCells: Observable<HeaderCell[]> = this._visibleColumnDef.pipe(
    map((cells) => cells.map((cell) => new HeaderCell(cell))),
  );
  visibleColumnsId: Observable<string[]> = this._visibleColumnDef.pipe(map((cells) => cells.map((cell) => cell.id)));
  tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this._visibleColumnDef]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );

  unsubscribeAll = new Subject<void>();

  private localStorage = inject(LOCAL_STORAGE);

  constructor() {
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
}
