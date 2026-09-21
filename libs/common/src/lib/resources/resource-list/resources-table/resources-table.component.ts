import { ChangeDetectionStrategy, Component, inject, OnChanges, SimpleChanges } from '@angular/core';
import { ColoredLabel, ColumnHeader } from '../resource-list.model';
import { delay, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { catchError, combineLatest, defer, from, Observable, of, take, toArray } from 'rxjs';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';
import { Classification, Resource, UserClassification } from '@nuclia/core';
import { LabelsService } from '@flaps/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { UploadService } from '../../../upload/upload.service';
import { formatKeyValue, mergeExistingAndNewLabels, removeLabels } from '../../edit-resource';

@Component({
  selector: 'stf-resources-table',
  templateUrl: './resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourcesTableComponent extends ResourcesTableDirective implements OnChanges {
  protected uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(
    map((statusCount) => statusCount.processed + statusCount.pending + statusCount.error),
  );
  labelSets = this.resourceListService.labelSets;
  isReady = this.resourceListService.ready;
  tableLoading = this.resourceListService.tableLoading;
  status = this.resourceListService.status;
  selectedColumns = this.resourceListService.selectedColumns;
  isFiltering = combineLatest([this.resourceListService.filters, this.resourceListService.query]).pipe(
    map(([filters, query]) => filters.length > 0 || query !== ''),
  );
  hiddenResourcesEnabled = this.resourceListService.hiddenResourcesEnabled;

  protected override defaultColumns: ColumnHeader[] = [
    { id: 'title', label: 'resource.title', size: 'minmax(280px, 3fr)', sortable: true },
    {
      id: 'classification',
      label: 'resource.classification-column',
      size: 'minmax(304px, 1fr)',
      optional: true,
    },
    {
      id: 'created',
      label: 'resource.created',
      size: '128px',
      sortable: true,
      centered: true,
      optional: true,
    },
    {
      id: 'modified',
      label: 'resource.modified',
      size: '128px',
      sortable: true,
      centered: true,
      optional: true,
    },
    {
      id: 'language',
      label: 'generic.language',
      size: '112px',
      centered: true,
      optional: true,
    },
    {
      id: 'key-value-fields',
      label: 'resource.field-key_value',
      size: 'minmax(256px, 1.5fr)',
      optional: true,
    },
  ];

  optionalColumns: ColumnHeader[] = this.defaultColumns.filter((column) => column.optional);
  hasLabelSets = inject(LabelsService).hasResourceLabelSets;
  currentAddLabelList: Classification[] = [];
  currentRemoveLabelList: Classification[] = [];
  deletingLabel = false;
  fullLabels = false;
  fullKeyValue = false;
  formatKeyValue = formatKeyValue;
  skeletonRows = new Array(20);

  private _visibleColumnDef: Observable<ColumnHeader[]> = combineLatest([
    this.isAdminOrContrib,
    this.hiddenResourcesEnabled,
    this.selectedColumns,
  ]).pipe(
    map(([canEdit, hiddenResourcesEnabled, selectedColumns]) => {
      const visibleColumns = this.defaultColumns
        .map(this.getApplySortingMapper())
        .filter((column) => !column.optional || selectedColumns.includes(column.id));
      const extraColumns: ColumnHeader[] = [];
      if (hiddenResourcesEnabled) {
        extraColumns.push({ id: 'visibility', label: 'resource.visibility', size: '96px' });
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
    if (labelToRemove.immutable) {
      classifications.push({
        label: labelToRemove.label,
        labelset: labelToRemove.labelset,
        cancelled_by_user: true,
      });
    } else {
      classifications = classifications.filter(
        (label) => !(label.labelset === labelToRemove.labelset && label.label === labelToRemove.label),
      );
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
                                ? removeLabels(resource, labels)
                                : mergeExistingAndNewLabels(resource, labelSets, labels),
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

  toggleColumn(column: ColumnHeader, event?: MouseEvent | KeyboardEvent) {
    if (event && (event.target as HTMLElement).tagName !== 'LI') {
      return;
    }
    this.selectedColumns.pipe(take(1)).subscribe((columns) => {
      if (columns.includes(column.id)) {
        this.resourceListService.setSelectedColumns(columns.filter((col) => col !== column.id));
      } else {
        this.resourceListService.setSelectedColumns([...columns, column.id]);
      }
    });
  }
}
