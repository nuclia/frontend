import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { getFilesGroupedByType, SearchWidgetService } from '@flaps/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { take, of, delay } from 'rxjs';
import { DroppedFile, FileUploadModule } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { SimpleKBService } from './simple-kb.service';
import { McpEndpointModalComponent } from './mcp-endpoint/mcp-endpoint-modal.component';
import { ResourceTableComponent } from './resource-table/resource-table.component';

@Component({
  selector: 'app-simple-kb',
  templateUrl: './simple-kb.component.html',
  styleUrls: ['./simple-kb.component.scss'],
  imports: [CommonModule, FileUploadModule, PaButtonModule, PaIconModule, ResourceTableComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleKBComponent {
  private simpleKBService = inject(SimpleKBService);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);

  widgetPreview = this.searchWidgetService.widgetPreview;
  maxFiles = this.simpleKBService.maxFiles;

  uploadInProgress = toSignal(this.simpleKBService.uploadInProgress, { initialValue: false });
  counter = toSignal(this.simpleKBService.resourceCounter);
  pendingResources = computed(() => (this.counter()?.pending || 0) > 0 || this.uploadInProgress());
  step = signal<number>(-1);
  hideResources = signal(false);
  fileOver = signal(false);

  constructor() {
    this.simpleKBService.resources.pipe(take(1)).subscribe((resources) => {
      if (resources.length === 0) {
        this.step.set(1);
      } else {
        this.goToStep3();
      }
    });
  }

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  uploadFiles(files: File[]) {
    if (this.step() === 1) {
      this.step.set(2);
    }
    if (this.step() === 3 && this.hideResources()) {
      this.hideResources.set(false);
    }
    this.simpleKBService.uploadFiles(files);
  }

  onFilesSelected(files: File[] | FileList | DroppedFile[]) {
    const fileTypes = getFilesGroupedByType(files);
    this.uploadFiles([...fileTypes.mediaFiles, ...fileTypes.nonMediaFiles]);
  }

  goToStep3() {
    this.step.set(3);
    this.initWidget();
  }

  initWidget() {
    this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG);
    of(true)
      .pipe(
        delay(1000), // Wait for the widget to be rendered
      )
      .subscribe(() => {
        const element = document.querySelector('nuclia-search-bar');
        element?.addEventListener('search', () => this.hideResources.set(true));
        element?.addEventListener('resetQuery', () => this.hideResources.set(false));
      });
  }

  resetSearch() {
    this.searchWidgetService.resetSearchQuery();
    this.initWidget();
    this.hideResources.set(false);
  }

  showMcpEndpoint() {
    this.modalService.openModal(McpEndpointModalComponent);
  }
}
