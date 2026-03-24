import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { searchResources, UploadService } from '@flaps/common';
import { NavigationService, SDKService } from '@flaps/core';
import { PaDateTimeModule, PaIconModule, PaTableModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IResource, RESOURCE_STATUS, SortField } from '@nuclia/core';
import { MimeIconPipe, SisIconsModule } from '@nuclia/sistema';
import { combineLatest, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';

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
export class LastResourcesComponent {
  private navigationService = inject(NavigationService);
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  account = this.sdk.currentAccount;
  currentKb = this.sdk.currentKb;
  kbUrl = combineLatest([this.account, this.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      const url = this.navigationService.getKbUrl(account.slug, kbSlug);
      console.log({ url });
      return url;
    }),
  );
  selectedResourcesTab: 'processed' | 'pending' = 'processed';
  statusChanged = this.uploadService.statusCount.pipe(distinctUntilChanged());
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
}
