import { ChangeDetectionStrategy, Component, inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ColoredLabel, ColumnHeader, DEFAULT_PREFERENCES, RESOURCE_LIST_PREFERENCES } from '../resource-list.model';
import { delay, filter, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, catchError, combineLatest, defer, from, Observable, of, skip, take, toArray } from 'rxjs';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import { Classification, deDuplicateList, LabelSets, Resource, UserClassification } from '@nuclia/core';
import { LabelsService } from '@flaps/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { ResourcesTableDirective } from '../resources-table.directive';
import { UploadService } from '../../../upload/upload.service';
import { getClassificationsPayload } from '../../edit-resource';

@Component({
  selector: 'stf-resources-table',
  templateUrl: './resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourcesTableComponent extends ResourcesTableDirective implements OnInit, OnDestroy, OnChanges {
  protected uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(
    map((statusCount) => statusCount.processed + statusCount.pending + statusCount.error),
  );
  labelSets = this.resourceListService.labelSets;
  isReady = this.resourceListService.ready;
  isFiltering = combineLatest([this.resourceListService.filters, this.resourceListService.query]).pipe(
    map(([filters, query]) => filters.length > 0 || query !== ''),
  );
  hiddenResourcesEnabled = this.resourceListService.hiddenResourcesEnabled;

  get initialColumns(): ColumnHeader[] {
    return [
      { id: 'title', label: 'resource.title', size: 'minmax(280px, 3fr)', sortable: true, visible: true },
      {
        id: 'classification',
        label: 'resource.classification-column',
        size: 'minmax(304px, 1fr)',
        optional: true,
        visible: this.userPreferences.columns.includes('classification'),
      },
      {
        id: 'created',
        label: 'resource.created',
        size: '128px',
        sortable: true,
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('created'),
      },
      {
        id: 'modified',
        label: 'resource.modified',
        size: '128px',
        sortable: true,
        centered: true,
        optional: true,
        visible: this.userPreferences.columns.includes('modified'),
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

  hasLabelSets = inject(LabelsService).hasResourceLabelSets;
  currentAddLabelList: Classification[] = [];
  currentRemoveLabelList: Classification[] = [];
  deletingLabel = false;
  fullLabels = false;

  private _visibleColumnDef: Observable<ColumnHeader[]> = combineLatest([
    this.isAdminOrContrib,
    this.hiddenResourcesEnabled,
    this.columnVisibilityUpdate,
  ]).pipe(
    map(([canEdit, hiddenResourcesEnabled]) => {
      const visibleColumns = this.defaultColumns.map(this.getApplySortingMapper()).filter((column) => column.visible);
      const extraColumns: ColumnHeader[] = [];
      if (hiddenResourcesEnabled) {
        extraColumns.push({ id: 'visibility', label: 'resource.visibility', size: '96px', visible: true });
      }
      if (canEdit) {
        extraColumns.push({ id: 'menu', label: 'generic.actions', size: '96px' });
      }
      return [...visibleColumns, ...extraColumns];
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

  override ngOnInit() {
    super.ngOnInit();
    this.columnVisibilityUpdate.pipe(skip(1), takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.userPreferences.columns = this.defaultColumns
        .map((column) => (column.optional && column.visible ? column.id : ''))
        .filter((value) => !!value);
      this.localStorage.setItem(RESOURCE_LIST_PREFERENCES, JSON.stringify(this.userPreferences));
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
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

    let classifications: UserClassification[] = resource.usermetadata?.classifications || [];
    if (!labelToRemove.immutable) {
      classifications = classifications.filter(
        (label) => !(label.labelset === labelToRemove.labelset && label.label === labelToRemove.label),
      );
    } else {
      classifications.push({
        label: labelToRemove.label,
        labelset: labelToRemove.labelset,
        cancelled_by_user: true,
      });
    }
    resource
      .modify({
        usermetadata: {
          ...resource.usermetadata,
          classifications,
        },
      })
      .pipe(
        switchMap(() => this.resourceListService.loadResources(true, false)),
        catchError(() => {
          this.toaster.error(
            `An error occurred while removing "${labelToRemove.labelset} – ${labelToRemove.label}" label, please try again later.`,
          );
          return this.resourceListService.loadResources(true, false);
        }),
      )
      .subscribe(() => {
        this.deletingLabel = false;
        this.cdr.markForCheck();
      });
  }

  updateAddLabelList(list: Classification[]) {
    this.currentAddLabelList = list;
  }

  updateRemoveLabelList(list: Classification[]) {
    this.currentRemoveLabelList = list;
  }

  addLabelsToSelection() {
    if (this.currentAddLabelList.length > 0) {
      this.updateLabelsToSelection(this.currentAddLabelList);
    }
  }

  removeLabelsToSelection() {
    if (this.currentRemoveLabelList.length > 0) {
      this.updateLabelsToSelection(this.currentRemoveLabelList, true);
    }
  }

  private updateLabelsToSelection(labels: Classification[], remove = false) {
    const resourcesObs = this.allResourcesSelected ? this.getAllResources() : this.getSelectedResources();
    const confirm = this.allResourcesSelected
      ? this.modalService.openConfirm({
          title: 'resource.labels.confirm',
        }).onClose
      : of(true);
    confirm
      .pipe(
        filter((yes) => !!yes),
        switchMap(() =>
          this.resourceListService.labelSets.pipe(
            take(1),
            switchMap((labelSets) =>
              resourcesObs.pipe(
                tap((resources) => {
                  this.isLoading = true;
                  if (resources.length > 1) {
                    this.bulkAction = {
                      inProgress: true,
                      done: 0,
                      errors: 0,
                      total: resources.length,
                      label: 'resource.labels.updating',
                    };
                    this.cdr.markForCheck();
                  }
                }),
                switchMap((resources) => {
                  const bulkActionItems = resources.map((resource) =>
                    this.updateBulkAction(
                      defer(() =>
                        resource
                          .modify({
                            usermetadata: {
                              ...resource.usermetadata,
                              classifications: remove
                                ? this.removeLabels(resource, labels)
                                : this.mergeExistingAndSelectedLabels(resource, labelSets, labels),
                            },
                          })
                          .pipe(delay(1000)),
                      ),
                    ),
                  );
                  return from(bulkActionItems);
                }),
                mergeMap((obs) => obs, 5),
                toArray(),
                switchMap(() => this.resourceListService.loadResources()),
                tap(() => {
                  this.manageBulkActionResults('labelling');
                  this.cdr.markForCheck();
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe();
  }

  selectColumn(column: ColumnHeader, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      column.visible = !column.visible;
      this.columnVisibilityUpdate.next(!column.visible);
    }
  }

  private mergeExistingAndSelectedLabels(
    resource: Resource,
    labelSets: LabelSets,
    labels: Classification[],
  ): Classification[] {
    const exclusiveLabelSets = Object.entries(labelSets)
      .filter(([, labelSet]) => !labelSet.multiple)
      .filter(([id]) => labels.some((label) => label.labelset === id))
      .map(([id]) => id);

    const resourceLabels = resource
      .getClassifications()
      .filter((label) => !exclusiveLabelSets.includes(label.labelset));

    return getClassificationsPayload(
      resource,
      deDuplicateList(resourceLabels.concat(labels.map((label) => ({ ...label, cancelled_by_user: false })))),
    );
  }

  private removeLabels(resource: Resource, labels: Classification[]): Classification[] {
    const resourceLabels = resource
      .getClassifications()
      .filter((label) => !labels.some((l) => l.labelset === label.labelset && l.label === label.label));

    return getClassificationsPayload(
      resource,
      resourceLabels.map((label) => ({ ...label, cancelled_by_user: false })),
    );
  }
}
