import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ResourceListService, SearchWidgetService, UploadDialogService, UploadService } from '@flaps/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { HomeContainerComponent, SisProgressModule } from '@nuclia/sistema';
import { LastResourcesComponent } from '../knowledge-box-home/last-resources/last-resources.component';
import { CommonModule } from '@angular/common';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { combineLatest, map } from 'rxjs';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-simple-kb',
  templateUrl: './simple-kb.component.html',
  styleUrls: ['./simple-kb.component.scss'],
  imports: [
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
  emptyKb = combineLatest([this.sdk.counters, this.uploadService.statusCount]).pipe(
    map(([counters, statusCount]) => {
      return (
        (!counters?.resources || counters.resources === 0) &&
        statusCount.error + statusCount.pending + statusCount.processed === 0
      );
    }),
  );
  uploadInProgress = this.uploadService.uploadInProgress;
  totalResources = this.uploadService.statusCount.pipe(
    map((statusCount) => statusCount.processed + statusCount.pending + statusCount.error),
  );

  uploadFiles() {
    this.upload.upload('files');
  }

  ngOnInit(): void {
    this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG, undefined, '#preview');
    this.uploadService.updateStatusCount();
  }
  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }
}
