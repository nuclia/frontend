import { ChangeDetectionStrategy, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FeaturesService, SDKService, STFTrackingService } from '@flaps/core';
import { PopoverDirective } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { UploadService } from '../../upload/upload.service';
import { ResourceListService } from './resource-list.service';

const POPOVER_DISPLAYED = 'NUCLIA_STATUS_POPOVER_DISPLAYED';

@Component({
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent implements OnDestroy {
  @ViewChild('pendingPopoverDirective') pendingPopoverDirective?: PopoverDirective;
  @ViewChild('failedPopoverDirective') failedPopoverDirective?: PopoverDirective;

  private localStorage = inject(LOCAL_STORAGE);

  unsubscribeAll = new Subject<void>();

  statusCount = this.uploadService.statusCount.pipe(
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

  get isMainView(): boolean {
    return !this.resourceListService.status;
  }
  get isProcessedView(): boolean {
    return this.resourceListService.status === 'PROCESSED';
  }
  get isPendingView(): boolean {
    return this.resourceListService.status === 'PENDING';
  }
  get isErrorView(): boolean {
    return this.resourceListService.status === 'ERROR';
  }

  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.features.isKbAdminOrContrib;
  query = this.resourceListService.query;

  standalone = this.sdk.nuclia.options.standalone;
  emptyKb = this.resourceListService.emptyKb;

  constructor(
    private sdk: SDKService,
    private uploadService: UploadService,
    private resourceListService: ResourceListService,
    private tracking: STFTrackingService,
    private features: FeaturesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.resourceListService.updateCount().subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onQueryChange(query: string) {
    this.resourceListService.setQuery(query);
    // Reset resource list when query is empty (without forcing user to hit enter)
    if (!query) {
      this.search();
    }
  }

  goToView(path: '' | 'processed' | 'pending' | 'error') {
    this.router.navigate([`./${path}`], { relativeTo: this.route });
  }

  search() {
    this.tracking.logEvent('search-in-resource-list', { searchIn: 'titles' });
    this.resourceListService.search();
  }
}
