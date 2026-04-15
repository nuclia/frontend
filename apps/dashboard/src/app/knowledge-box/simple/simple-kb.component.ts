import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SearchWidgetService, UploadDialogService, UploadService } from '@flaps/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { HomeContainerComponent, SisProgressModule, ButtonMiniComponent } from '@nuclia/sistema';
import { LastResourcesComponent } from '../knowledge-box-home/last-resources/last-resources.component';
import { CommonModule } from '@angular/common';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { combineLatest, map, take } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-simple-kb',
  templateUrl: './simple-kb.component.html',
  styleUrls: ['./simple-kb.component.scss'],
  imports: [
    ButtonMiniComponent,
    TranslateModule,
    PaButtonModule,
    HomeContainerComponent,
    LastResourcesComponent,
    PaIconModule,
    CommonModule,
    SisProgressModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleKBComponent implements OnDestroy, OnInit {
  private upload = inject(UploadDialogService);
  private searchWidgetService = inject(SearchWidgetService);
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  widgetPreview = this.searchWidgetService.widgetPreview;
  totalResources = this.uploadService.statusCount.pipe(
    map((statusCount) => statusCount.processed + statusCount.pending + statusCount.error),
  );
  emptyKb = combineLatest([this.sdk.counters, this.totalResources]).pipe(
    map(([counters, totalResources]) => {
      return (!counters?.resources || counters.resources === 0) && totalResources === 0;
    }),
  );
  uploadInProgress = this.uploadService.uploadInProgress;

  endpoint = this.sdk.currentKb.pipe(map((kb) => kb.fullpath + '/mcp'));
  copied = signal(false);

  uploadFiles() {
    this.upload.upload('files');
  }

  ngOnInit(): void {
    this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG, undefined, '#preview');
    this.uploadService.updateStatusCount().subscribe();
  }
  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => {
      this.copied.set(true);
      navigator.clipboard.writeText(endpoint);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
