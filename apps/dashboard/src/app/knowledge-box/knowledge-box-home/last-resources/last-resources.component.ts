import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { searchResources, UploadService } from '@flaps/common';
import { NavigationService, NotificationService, SDKService } from '@flaps/core';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTabsModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IResource, Resource, RESOURCE_STATUS, SortField } from '@nuclia/core';
import { SisIconsModule, SisModalService } from '@nuclia/sistema';
import { combineLatest, filter, map, Observable, startWith, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-last-resources',
  templateUrl: 'last-resources.component.html',
  styleUrls: ['./last-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PaButtonModule,
    PaDropdownModule,
    PaIconModule,
    PaPopupModule,
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
  private modalService = inject(SisModalService);
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
    this.uploadService.refreshNeeded.pipe(startWith(true)),
    this.notificationService.hasNewResourceOperationNotifications.pipe(startWith(true)),
  ]).pipe(map(([refresh, newRes]) => refresh && newRes));
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
  isAdminOrContrib = this.sdk.isAdminOrContrib;

  ngOnInit(): void {
    this.uploadService.updateStatusCount();
  }

  deleteResource(resourceData: IResource) {
    this.modalService
      .openConfirm({
        title: 'resource.confirm-delete.title',
        description: 'resource.confirm-delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => result),
        switchMap(() => this.sdk.currentKb.pipe(take(1))),
        switchMap((kb) => new Resource(this.sdk.nuclia, kb.id, resourceData).delete()),
      )
      .subscribe(() => {
        this.uploadService.updateAfterUploads();
      });
  }
}
