import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { searchResources, UploadService } from '@flaps/common';
import { NavigationService, NotificationService, SDKService } from '@flaps/core';
import { PaDateTimeModule, PaIconModule, PaTableModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IResource, RESOURCE_STATUS, SortField } from '@nuclia/core';
import { MimeIconPipe, SisIconsModule } from '@nuclia/sistema';
import { combineLatest, distinctUntilChanged, map, Observable, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-last-resources',
  templateUrl: 'last-resources.component.html',
  styleUrls: ['./last-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PaIconModule,
    PaTableModule,
    PaTabsModule,
    TranslateModule,
    RouterModule,
    PaDateTimeModule,
    SisIconsModule,
  ],
})
export class LastResourcesComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  private notificationService = inject(NotificationService);
  account = this.sdk.currentAccount;
  currentKb = this.sdk.currentKb;
  kbUrl = combineLatest([this.account, this.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      const url = this.navigationService.getKbUrl(account.slug, kbSlug);
      return url;
    }),
  );
  selectedResourcesTab: 'processed' | 'pending' = 'processed';
  statusChanged = combineLatest([
    this.uploadService.refreshNeeded,
    this.notificationService.hasNewResourceOperationNotifications,
  ]).pipe(
    startWith([true, true]),
    map(([refresh, newRes]) => refresh && newRes),
  );
  latestProcessedResources: Observable<IResource[]> = combineLatest([this.currentKb, this.statusChanged]).pipe(
    switchMap(([kb]) =>
      searchResources(kb, {
        pageSize: 6,
        sort: { field: SortField.created, order: 'desc' },
        query: '',
        filters: [],
        page: 0,
        status: RESOURCE_STATUS.PROCESSED,
      }),
    ),
    map((data) => Object.values(data.results.resources || {})),
  );
  processingQueue: Observable<IResource[]> = combineLatest([this.currentKb, this.statusChanged]).pipe(
    switchMap(([kb]) =>
      searchResources(kb, {
        pageSize: 6,
        sort: { field: SortField.created, order: 'desc' },
        query: '',
        filters: [],
        page: 0,
        status: RESOURCE_STATUS.PENDING,
      }),
    ),
    map((data) => Object.values(data.results.resources || {})),
  );

  ngOnInit(): void {
    this.uploadService.updateStatusCount();
  }
}
