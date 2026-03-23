import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SearchWidgetService, UploadDialogService } from '@flaps/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { HomeContainerComponent } from '@nuclia/sistema';
import { LastResourcesComponent } from '../knowledge-box-home/last-resources/last-resources.component';
import { CommonModule } from '@angular/common';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleKBComponent implements OnDestroy, OnInit {
  private upload = inject(UploadDialogService);
  private searchWidgetService = inject(SearchWidgetService);
  widgetPreview = this.searchWidgetService.widgetPreview;

  uploadFiles() {
    this.upload.upload('files');
  }

  ngOnInit(): void {
    this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG, undefined, '#preview');
  }
  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }
}
