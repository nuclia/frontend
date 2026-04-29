import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { getFilesGroupedByType, SearchWidgetService } from '@flaps/common';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { take, of, delay, Subject, filter, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { DroppedFile, FileUploadModule, SDKService } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { SimpleKBService } from './simple-kb.service';
import { McpEndpointModalComponent } from './mcp-endpoint/mcp-endpoint-modal.component';
import { ResourceTableComponent } from './resource-table/resource-table.component';
import { HistoryTableComponent } from './history-table/history-table.component';

@Component({
  selector: 'app-simple-kb',
  templateUrl: './simple-kb.component.html',
  styleUrls: ['./simple-kb.component.scss'],
  imports: [
    CommonModule,
    FileUploadModule,
    HistoryTableComponent,
    PaButtonModule,
    PaIconModule,
    ResourceTableComponent,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleKBComponent {
  private simpleKBService = inject(SimpleKBService);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private sdk = inject(SDKService);

  widgetPreview = this.searchWidgetService.widgetPreview;
  maxFiles = this.simpleKBService.maxFiles;
  logs = new Subject<any>();

  uploadInProgress = toSignal(this.simpleKBService.uploadInProgress, { initialValue: false });
  counter = toSignal(this.simpleKBService.resourceCounter);
  pendingResources = computed(() => (this.counter()?.pending || 0) > 0 || this.uploadInProgress());
  step = signal<number>(-1);
  fileOver = signal(false);

  view = signal<'resources' | 'history' | 'search'>('resources');
  prevQuestionId?: string;

  constructor() {
    this.simpleKBService.resources.pipe(take(1)).subscribe((resources) => {
      if (resources.length === 0) {
        this.step.set(1);
      } else {
        this.goToStep3();
      }
    });

    // Make sure that enforce_security is enabled.
    // It's required to prevent external agents using the MCP endpoint from retrieving conversation resources.
    this.sdk.currentKb
      .pipe(
        take(1),
        filter((kb) => kb.enforce_security === false),
        switchMap((kb) => kb.modify({ enforce_security: true })),
      )
      .subscribe(() => {
        this.sdk.refreshKbList(true);
      });

    this.logs
      .pipe(
        // Listen to query changes
        distinctUntilChanged((prev, curr) => prev['lastQuery'].params.query === curr['lastQuery'].params.query),
        // Once the query is sent, we wait for the complete response
        switchMap(() =>
          this.logs.pipe(
            filter((event) => event['lastResults']?.type === 'error' || event['lastResults']?.incomplete === false),
            take(1),
          ),
        ),
        switchMap((event) =>
          (event['lastQuery']?.params?.context || []).length > 0
            ? this.simpleKBService.appendQuestion(
                this.prevQuestionId || '',
                event['lastQuery'].params.query,
                event['lastResults']?.text || '',
              )
            : this.simpleKBService
                .createQuestion(
                  'Question ' + Date.now(),
                  event['lastQuery'].params.query,
                  event['lastResults']?.text || '',
                )
                .pipe(tap(({ uuid }) => (this.prevQuestionId = uuid))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  uploadFiles(files: File[]) {
    if (this.step() === 1) {
      this.step.set(2);
    }
    if (this.step() === 3 && this.view() !== 'resources') {
      this.view.set('resources');
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
        element?.addEventListener('search', () => this.view.set('search'));
        element?.addEventListener('resetQuery', () => this.view.set('resources'));
        element?.addEventListener('logs', (event: any) => this.logs.next(event.detail));
      });
  }

  resetSearch() {
    this.searchWidgetService.resetSearchQuery();
    this.initWidget();
  }

  changeView(view: 'resources' | 'history') {
    if (this.view() === 'search') {
      this.resetSearch();
    }
    this.view.set(view);
  }

  showMcpEndpoint() {
    this.modalService.openModal(McpEndpointModalComponent);
  }
}
