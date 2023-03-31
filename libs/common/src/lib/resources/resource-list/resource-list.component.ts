import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, catchError, forkJoin, from, mergeMap, Observable, of, Subject, take } from 'rxjs';
import { debounceTime, delay, filter, map, switchMap, takeUntil, tap, toArray } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Classification,
  deDuplicateList,
  IResource,
  LabelSetKind,
  LabelSets,
  ProcessingStatusResponse,
  Resource,
  RESOURCE_STATUS,
  ResourceStatus,
  Search,
  SearchOptions,
  SortOption,
  UserClassification,
} from '@nuclia/core';
import { BackendConfigurationService, SDKService, StateService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { DomSanitizer } from '@angular/platform-browser';
import { SampleDatasetService } from '../sample-dataset/sample-dataset.service';
import { LabelsService } from '../../label/labels.service';
import { PopoverDirective, TRANSITION_DURATION } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { getClassificationsPayload } from '../edit-resource';
import {
  ColoredLabel,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORTING,
  MenuAction,
  ResourceWithLabels,
} from './resource-list.model';

const POPOVER_DISPLAYED = 'NUCLIA_STATUS_POPOVER_DISPLAYED';

@Component({
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements OnInit, OnDestroy {
  @ViewChild('pendingPopoverDirective') pendingPopoverDirective?: PopoverDirective;
  @ViewChild('failedPopoverDirective') failedPopoverDirective?: PopoverDirective;

  private localStorage = inject(LOCAL_STORAGE);
  private sampleDatasetService = inject(SampleDatasetService);
  hasSampleData = this.sampleDatasetService.hasSampleResources();

  data: ResourceWithLabels[] | undefined;
  page = 0;
  hasMore = false;
  pageSize = DEFAULT_PAGE_SIZE;
  sort: SortOption = DEFAULT_SORTING;
  isLoading = true;
  unsubscribeAll = new Subject<void>();
  refreshing = true;

  private _statusCount: BehaviorSubject<{ pending: number; error: number }> = new BehaviorSubject({
    pending: 0,
    error: 0,
  });
  statusCount = this._statusCount.asObservable().pipe(
    tap((count) => {
      if (this.localStorage.getItem(POPOVER_DISPLAYED) !== 'done' && (count.error > 0 || count.pending > 0)) {
        // we cannot open the two popovers at the same time, so error takes priority
        setTimeout(() => {
          const popover = count.error > 0 ? this.failedPopoverDirective : this.pendingPopoverDirective;
          popover?.toggle();
          this.localStorage.setItem(POPOVER_DISPLAYED, 'done');
          // Close after 5s if still visible
          setTimeout(() => {
            if (popover?.popupDirective.paPopup?.isDisplayed) {
              popover.toggle();
            }
          }, 5000);
        });
      }
    }),
  );

  statusDisplayed: BehaviorSubject<ResourceStatus> = new BehaviorSubject<ResourceStatus>('PROCESSED');
  private currentProcessingStatus?: ProcessingStatusResponse;

  get isMainView() {
    return this.statusDisplayed.value === 'PROCESSED';
  }
  get isFailureView() {
    return this.statusDisplayed.value === 'ERROR';
  }
  get isPendingView() {
    return this.statusDisplayed.value === 'PENDING';
  }

  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => this.sdk.nuclia.options.standalone || !!kb.admin || !!kb.contrib));

  labelSets$: Observable<LabelSets> = this.labelService.getLabelsByKind(LabelSetKind.RESOURCES).pipe(
    filter((labelSets) => !!labelSets),
    map((labelSets) => labelSets as LabelSets),
  );

  searchForm = new FormGroup({
    searchIn: new FormControl<'title' | 'resource'>('title'),
    query: new FormControl<string>(''),
  });

  get query() {
    return this.searchForm.controls.query.getRawValue();
  }

  bulkAction = {
    inProgress: false,
    total: 0,
    done: 0,
    errors: 0,
    label: '',
  };

  standalone = this.sdk.nuclia.options.standalone;
  emptyKb = false;

  constructor(
    private sdk: SDKService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
    private stateService: StateService,
    private toaster: SisToastService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private labelService: LabelsService,
  ) {}

  ngOnInit(): void {
    this.getResources().subscribe(() => {
      this.emptyKb = this.data?.length === 0;
      this.cdr.markForCheck();
    });
    this.getResourceStatusCount().subscribe();
    this.sdk.refreshing
      .pipe(
        takeUntil(this.unsubscribeAll),
        tap(() => (this.refreshing = true)),
        switchMap(() => this.getResources()),
      )
      .subscribe();

    // Reset resource list when query is empty (without forcing user to hit enter)
    this.searchForm.controls.query.valueChanges
      .pipe(
        debounceTime(TRANSITION_DURATION.moderate),
        filter((value) => !value),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.search());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onUpload() {
    this.getResourceStatusCount().subscribe();
  }

  search() {
    if (!this.searchForm.value.query) {
      this.searchForm.controls.searchIn.setValue('title');
    }
    this.page = 0;
    this.triggerLoadResources();
  }

  delete(resources: Resource[]) {
    const title = resources.length > 1 ? 'resource.delete_resources_confirm' : 'resource.delete_resource_confirm';
    const message =
      resources.length > 1 ? 'resource.confirm-delete.plural-description' : 'resource.confirm-delete.description';
    this.modalService
      .openConfirm({
        title,
        description: message,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        tap(() => {
          this.setLoading(true);
          if (resources.length > 1) {
            this.bulkAction = {
              inProgress: true,
              done: 0,
              errors: 0,
              total: resources.length,
              label: 'generic.deleting',
            };
            this.cdr.markForCheck();
          }
        }),
        switchMap(() =>
          from(
            resources.map((resource) =>
              resource.delete().pipe(
                tap(() => {
                  this.bulkAction = {
                    ...this.bulkAction,
                    done: this.bulkAction.done + 1,
                  };
                  this.cdr.markForCheck();
                }),
                catchError(() => {
                  this.bulkAction = {
                    ...this.bulkAction,
                    errors: this.bulkAction.errors + 1,
                  };
                  return of(null);
                }),
              ),
            ),
          ),
        ),
        mergeMap((resourceDelete) => resourceDelete, 6),
        toArray(),
        delay(1000),
        switchMap(() => this.getResourceStatusCount()),
      )
      .subscribe(() => {
        if (this.bulkAction.errors > 0) {
          this.toaster.error(`${this.bulkAction.errors > 1 ? 'error.deleting-resources' : 'error.deleting-resource'}`);
        }
        this.afterBulkActions();
        this.sdk.refreshCounter(true);
      });
  }

  bulkReprocess(resources: Resource[], wait = 1000) {
    this.setLoading(true);

    this.bulkAction = {
      inProgress: true,
      done: 0,
      errors: 0,
      total: resources.length,
      label: 'generic.reindexing',
    };

    from(
      resources.map((resource) =>
        resource.reprocess().pipe(
          tap(() => {
            this.bulkAction = {
              ...this.bulkAction,
              done: this.bulkAction.done + 1,
            };
            this.cdr.markForCheck();
          }),
          catchError(() => {
            this.bulkAction = {
              ...this.bulkAction,
              errors: this.bulkAction.errors + 1,
            };
            return of(null);
          }),
        ),
      ),
    )
      .pipe(
        mergeMap((resource) => resource, 6),
        toArray(),
        delay(wait),
        switchMap(() => this.getResourceStatusCount()),
        switchMap(() => this.getResources()),
      )
      .subscribe(() => {
        if (this.bulkAction.errors > 0) {
          this.toaster.error(
            `${this.bulkAction.errors > 1 ? 'error.reprocessing-resources' : 'error.reprocessing-resource'}`,
          );
        }
        this.afterBulkActions();
      });
  }

  reindex(resource: Resource) {
    resource
      .reprocess()
      .pipe(
        delay(1000), // wait for reprocess to be effective
        switchMap(() => this.getResources()),
        switchMap(() => this.getResourceStatusCount()),
      )
      .subscribe();
  }

  private afterBulkActions() {
    this.setLoading(false);
    this.bulkAction = { inProgress: false, total: 0, done: 0, errors: 0, label: '' };
    this.cdr.markForCheck();
  }

  viewResource(resourceId: string) {
    this.router.navigate([`./${resourceId}/edit/preview`], { relativeTo: this.route });
  }

  loadMore() {
    if (this.hasMore) {
      this.page += 1;
      this.triggerLoadResources(false);
    }
  }

  sortBy(sortOption: SortOption) {
    this.sort = sortOption;
    this.triggerLoadResources();
  }

  triggerLoadResources(displayLoader = true) {
    this.getResources(displayLoader).subscribe();
  }

  getResources(displayLoader = true): Observable<Search.Results> {
    const query = (this.searchForm.value.query || '').trim();
    const hasQuery = query.length > 0;
    const titleOnly = this.searchForm.value.searchIn === 'title';

    if (!this.standalone) {
      forkJoin([this.stateService.account.pipe(take(1)), this.stateService.stash.pipe(take(1))])
        .pipe(
          filter(([account, kb]) => !!account && !!kb),
          take(1),
          switchMap(([account]) => this.sdk.nuclia.db.getProcessingStatus(account!.id)),
        )
        .subscribe((status) => (this.currentProcessingStatus = status));
    }

    return of(1).pipe(
      tap(() => {
        this.setLoading(displayLoader);
      }),
      switchMap(() => this.sdk.currentKb.pipe(take(1))),
      switchMap((kb) => {
        const status = this.statusDisplayed.value;
        const searchOptions: SearchOptions = {
          page_number: this.page,
          page_size: this.pageSize,
          sort: this.sort,
          filters: status === RESOURCE_STATUS.PROCESSED ? undefined : [`/n/s/${status}`],
          with_status: status === RESOURCE_STATUS.PROCESSED ? status : undefined,
        };
        return forkJoin([
          of(kb),
          titleOnly
            ? kb.catalog(query, searchOptions)
            : kb.search(
                query,
                hasQuery
                  ? [Search.Features.PARAGRAPH, Search.Features.VECTOR, Search.Features.DOCUMENT]
                  : [Search.Features.DOCUMENT],
                searchOptions,
              ),
          this.labelSets$.pipe(take(1)),
        ]);
      }),
      map(([kb, results, labelSets]) => {
        const newResults = titleOnly
          ? this.getTitleOnlyData(results, kb.id, labelSets)
          : this.getResourceData(query, results, kb.id, labelSets);
        this.data = this.page === 0 ? newResults : (this.data || []).concat(newResults);
        this.hasMore = !!results.fulltext?.next_page;

        this.setLoading(false);
        return results;
      }),
    );
  }

  onMenuAction($event: { resource: Resource; action: MenuAction }) {
    const resourceId = $event.resource.id;
    switch ($event.action) {
      case 'annotate':
        this.router.navigate([`./${resourceId}/edit/annotation`], { relativeTo: this.route });
        break;
      case 'edit':
        this.router.navigate([`./${resourceId}/edit`], { relativeTo: this.route });
        break;
      case 'classify':
        this.router.navigate([`./${resourceId}/edit/classification`], { relativeTo: this.route });
        break;
      case 'delete':
        this.delete([$event.resource]);
        break;
      case 'reprocess':
        this.bulkReprocess([$event.resource]);
        break;
    }
  }

  private getResourceWithLabels(kbId: string, resourceData: IResource, labelSets: LabelSets): ResourceWithLabels {
    const resource = new Resource(this.sdk.nuclia, kbId, resourceData);
    const resourceWithLabels: ResourceWithLabels = {
      resource,
      labels: [],
    };
    const labels = resource.getClassifications();
    if (labels.length > 0) {
      resourceWithLabels.labels = labels.map((label) => ({
        ...label,
        color: labelSets[label.labelset]?.color || '#ffffff',
      }));
    }
    if (this.statusDisplayed.value === 'PENDING' && this.currentProcessingStatus) {
      resourceWithLabels.status = this.getProcessingStatus(resource);
    }

    return resourceWithLabels;
  }

  private getProcessingStatus(resource: Resource): string {
    if (!this.currentProcessingStatus) {
      return '';
    }
    const last_delivered_seqid =
      resource.queue === 'private'
        ? this.currentProcessingStatus.account?.last_delivered_seqid
        : this.currentProcessingStatus.shared?.last_delivered_seqid;
    if (resource.last_account_seq !== undefined) {
      const count =
        typeof last_delivered_seqid === 'number'
          ? resource.last_account_seq - last_delivered_seqid
          : resource.last_account_seq - 1;
      let statusKey = 'resource.status_processing';
      if (count === 1) {
        statusKey = 'resource.status_next';
      } else if (count > 1) {
        statusKey = 'resource.status_pending';
      }
      return this.translate.instant(statusKey, { count });
    } else {
      return this.translate.instant('resource.status_unknown');
    }
  }

  private getTitleOnlyData(results: Search.Results, kbId: string, labelSets: LabelSets): ResourceWithLabels[] {
    return Object.values(results.resources || {}).map((resourceData) =>
      this.getResourceWithLabels(kbId, resourceData, labelSets),
    );
  }

  private getResourceData(
    trimmedQuery: string,
    results: Search.Results,
    kbId: string,
    labelSets: LabelSets,
  ): ResourceWithLabels[] {
    const allResources = results.resources;
    if (!allResources || Object.keys(allResources).length === 0) {
      return [];
    }
    const fulltextOrderedResources: IResource[] =
      results.fulltext?.results.reduce((resources, result) => {
        const iResource: IResource = allResources[result.rid];
        if (result && iResource && !resources.find((resource) => resource.id === result.rid)) {
          resources.push(iResource);
        }
        return resources;
      }, [] as IResource[]) || [];
    const smartResults = fulltextOrderedResources.map((resourceData) =>
      this.getResourceWithLabels(kbId, resourceData, labelSets),
    );

    // if not a keyword search, fill results with the 2 best semantic sentences
    const looksLikeKeywordSearch = trimmedQuery.split(' ').length < 3;
    if (!looksLikeKeywordSearch) {
      const semanticResults = results.sentences?.results || [];
      const twoBestSemantic = semanticResults.slice(0, 2);
      twoBestSemantic.forEach((sentence) => {
        const resourceIndex = smartResults.findIndex((result) => result.resource.id === sentence.rid);
        if (resourceIndex > -1 && !smartResults[resourceIndex].description) {
          smartResults[resourceIndex].description = sentence.text;
        }
      });
    }

    // Fill the rest of the results with first paragraph
    const paragraphResults = results.paragraphs?.results || [];
    smartResults.forEach((result) => {
      if (!result.description) {
        const paragraph = paragraphResults.find((paragraph) => paragraph.rid === result.resource.id);
        if (paragraph) {
          result.description = paragraph.text;
        } else {
          // use summary as description when no paragraph
          result.description = result.resource.summary;
        }
      }
    });

    return smartResults;
  }

  addLabelsToSelection($event: { labels: Classification[]; resources: Resource[] }) {
    const { labels, resources } = $event;
    if (labels.length > 0) {
      this.bulkAction = {
        inProgress: true,
        done: 0,
        errors: 0,
        total: resources.length,
        label: 'resource.adding_labels',
      };
      const requests = resources.map((resource) => {
        return this.labelSets$.pipe(
          take(1),
          map((labelSets) => ({
            usermetadata: {
              ...resource.usermetadata,
              classifications: this.mergeExistingAndSelectedLabels(resource, labelSets, labels),
            },
          })),
          switchMap((updatedResource) =>
            resource.modify(updatedResource).pipe(
              map(() => ({ isError: false })),
              catchError((error) => of({ isError: true, error })),
            ),
          ),
        );
      });

      forkJoin(requests)
        .pipe(
          tap((results) => {
            const errorCount = results.filter((res) => res.isError).length;
            const successCount = results.length - errorCount;
            this.bulkAction = {
              inProgress: true,
              done: successCount,
              errors: errorCount,
              total: resources.length,
              label: 'resource.adding_labels',
            };
            if (successCount > 0) {
              this.toaster.success(this.translate.instant('resource.add_labels_success', { count: successCount }));
            }
            if (errorCount > 0) {
              this.toaster.error(this.translate.instant('resource.add_labels_error', { count: errorCount }));
            }
          }),
          switchMap(() => this.getResources()),
        )
        .subscribe(() => {
          this.bulkAction = {
            inProgress: false,
            done: 0,
            total: 0,
            errors: 0,
            label: '',
          };
          this.cdr.markForCheck();
        });
    }
  }

  deleteSampleDataset() {
    this.toaster.info('onboarding.dataset.delete_in_progress');
    this.sampleDatasetService
      .deleteSampleDataset()
      .pipe(
        tap((count) => {
          if (count.error === 0) {
            this.toaster.success('onboarding.dataset.delete_successful');
          } else if (count.success > 0) {
            this.toaster.warning(
              this.translate.instant('onboarding.dataset.delete_partially_successful', { error: count.error }),
            );
          } else {
            this.toaster.error('onboarding.dataset.delete_failed');
          }
        }),
        switchMap(() => this.getResources()),
      )
      .subscribe();
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

  setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.cdr?.markForCheck();
  }

  displayStatus(status: ResourceStatus) {
    this.page = 0;
    this.searchForm.patchValue({ searchIn: 'title', query: '' });
    this.statusDisplayed.next(status);
    this.getResources()
      .pipe(switchMap(() => this.getResourceStatusCount()))
      .subscribe();
  }

  private getResourceStatusCount(): Observable<{ pending: number; error: number; processed: number }> {
    const statusFacet = '/n/s';
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.catalog('', {
          faceted: [statusFacet],
        }),
      ),
      filter((results) => !!results.fulltext?.facets),
      map((results) => ({
        pending: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/PENDING`] || 0,
        error: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/ERROR`] || 0,
        processed: results.fulltext?.facets?.[statusFacet]?.[`${statusFacet}/PROCESSED`] || 0,
      })),
      tap((count) => {
        this._statusCount.next({ pending: count.pending, error: count.error });
      }),
    );
  }

  onDatasetImport(success: boolean) {
    if (success) {
      this.getResources()
        .pipe(switchMap(() => this.getResourceStatusCount()))
        .subscribe();
    }
  }

  removeLabel($event: { resource: Resource; labelToRemove: ColoredLabel }) {
    const { resource, labelToRemove } = $event;
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
        switchMap(() => this.getResources()),
        catchError(() => {
          this.toaster.error(
            `An error occurred while removing "${labelToRemove.labelset} – ${labelToRemove.label}" label, please try again later.`,
          );
          return this.getResources();
        }),
      )
      .subscribe();
  }
}
