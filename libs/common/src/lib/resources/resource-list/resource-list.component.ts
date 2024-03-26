import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject } from 'rxjs';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { NavigationService, SDKService, STFTrackingService } from '@flaps/core';
import { OptionModel, PopoverDirective } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { UploadService } from '../../upload/upload.service';
import { ResourceListService } from './resource-list.service';

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

  unsubscribeAll = new Subject<void>();

  searchOptions: OptionModel[] = [];

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
    return this.resourceListService.status === 'PROCESSED';
  }
  get isPendingView(): boolean {
    return this.resourceListService.status === 'PENDING';
  }

  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.sdk.isAdminOrContrib;

  searchForm = new FormGroup({
    searchIn: new FormControl<'title' | 'resource'>('title'),
    query: new FormControl<string>(''),
  });

  get query() {
    return this.searchForm.controls.query.getRawValue();
  }

  standalone = this.sdk.nuclia.options.standalone;
  emptyKb = this.resourceListService.emptyKb;
  isTrial = this.sdk.currentAccount.pipe(map((account) => account.type === 'stash-trial'));
  isAccountManager = this.sdk.currentAccount.pipe(map((account) => account.can_manage_account));
  upgradeUrl = this.sdk.currentAccount.pipe(map((account) => this.navigation.getUpgradeUrl(account.slug)));

  constructor(
    private sdk: SDKService,
    private translate: TranslateService,
    private uploadService: UploadService,
    private navigation: NavigationService,
    private resourceListService: ResourceListService,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit(): void {
    // Reset resource list when query is empty (without forcing user to hit enter)
    this.searchForm.controls.query.valueChanges
      .pipe(
        debounceTime(100),
        filter((value) => !value),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.search());

    // we need to wait for the translations to be loaded before setting the search options
    // because the default value (=title) is used to fill in the select input and this value is not refreshed
    // when the options are provided as ngContent
    this.translate
      .stream(['resource.search.in-title', 'resource.search.in-resource'])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((trans) => {
        this.searchOptions = [
          new OptionModel({ id: 'title', label: trans['resource.search.in-title'], value: 'title' }),
          new OptionModel({
            id: 'resource',
            label: trans['resource.search.in-resource'],
            value: 'resource',
          }),
        ];
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  search() {
    if (!this.searchForm.value.query) {
      this.searchForm.controls.searchIn.setValue('title');
    }
    const query = (this.searchForm.value.query || '').trim().replace('.', '\\.');
    const titleOnly = this.searchForm.value.searchIn === 'title';
    this.tracking.logEvent('search-in-resource-list', { searchIn: titleOnly ? 'titles' : 'resources' });
    this.resourceListService.search(query, titleOnly);
  }
}
