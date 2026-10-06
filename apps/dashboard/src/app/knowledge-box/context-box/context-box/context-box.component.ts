import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_WIDGET_CONFIG, getFilesGroupedByType, SearchWidgetService } from '@flaps/common';
import {
  DroppedFile,
  FeaturesService,
  FileDropDirective,
  FileSelectDirective,
  SDKService,
  SizePipe,
} from '@flaps/core';
import {
  ModalConfig,
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ExternalConnection, NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { SisModalService, SisToastService, SpinnerComponent } from '@nuclia/sistema';
import {
  catchError,
  combineLatest,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { HistoryTableModalComponent } from '../history-table/history-table-modal.component';
import { McpEndpointModalComponent } from '../mcp-endpoint/mcp-endpoint-modal.component';
import { ResourceTableModalComponent } from '../resource-table/resource-table-modal.component';
import { ContextBoxShareFileService } from './context-box-sharefile.service';
import { ContextBoxService } from './context-box.service';
import {
  ShareFileFolderModalComponent,
  ShareFileFolderSelection,
} from './sharefile-folder-modal/sharefile-folder-modal.component';

// Warning: this key name is declared in both dashboard app.init and in @nuclia/sync
// to avoid making a dependency
const PENDING_NEW_CONNECTOR_KEY = 'PENDING_NEW_CONNECTOR';

const CONTEXT_BOX_TITLE_INDEX = 'CONTEXT_BOX_TITLE_INDEX';
const TOTAL_TITLES = 20;

@Component({
  selector: 'app-context-box',
  templateUrl: './context-box.component.html',
  styleUrls: ['./context-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SizePipe],
  imports: [
    SpinnerComponent,
    PaIconModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    FileDropDirective,
    FileSelectDirective,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class ContextBoxComponent implements OnDestroy {
  private contextBoxService = inject(ContextBoxService);
  private shareFileService = inject(ContextBoxShareFileService);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private sdk = inject(SDKService);
  private sizePipe = inject(SizePipe);
  private features = inject(FeaturesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  widgetPreview = this.searchWidgetService.widgetPreview;
  logs = new Subject<any>();

  counter = toSignal(this.contextBoxService.resourceCounter);
  step = signal<number>(-1);
  fileOver = signal(false);
  maxFileSize = -1;
  maxMediaFileSize = -1;
  titleIndex = signal(1);

  view = signal<'resources' | 'search'>('resources');
  currentConversation?: string;

  connectedSource = this.shareFileService.connectedSource;
  isShareFileConnected = computed(() => !!this.connectedSource());

  constructor() {
    // Facet-only counter check (rather than the full paginated/ranked `resources` list) so
    // this initial decision doesn't force `resources$` — and its pagination state — to be
    // shared beyond the resource-table component that actually needs it.
    this.contextBoxService.resourceCounter.pipe(take(1)).subscribe((counter) => {
      const hasResources = counter.pending + counter.error + counter.processed > 0;
      if (hasResources) {
        this.goToStep3();
      } else {
        this.step.set(1);
      }
    });

    this.resumeShareFileOAuthIfNeeded();

    // Auto-advance from step 2 to step 3 once resources are confirmed processed.
    this.contextBoxService.resourceCounter
      .pipe(
        filter(() => this.step() === 2),
        filter((counter) => counter.pending === 0 && (counter.processed > 0 || counter.error > 0)),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.goToStep3());

    // Make sure that enforce_security is enabled.
    // It's required to prevent external agents using the MCP endpoint from retrieving conversation resources.
    combineLatest([this.sdk.currentKb, this.features.isKbAdmin])
      .pipe(
        take(1),
        filter(([kb, isAdmin]) => kb.enforce_security === false && isAdmin),
        switchMap(([kb]) => kb.modify({ enforce_security: true })),
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
            ? this.contextBoxService.appendQuestion(
                this.currentConversation || '',
                event['lastQuery'].params.query,
                event['lastResults']?.text || '',
                event['lastResults']?.text ? event['lastResults'] : undefined,
              )
            : this.contextBoxService
                .createQuestion(
                  'Question ' + Date.now(),
                  event['lastQuery'].params.query,
                  event['lastResults']?.text || '',
                  event['lastResults']?.text ? event['lastResults'] : undefined,
                )
                .pipe(tap(({ uuid }) => (this.currentConversation = uuid))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.maxFileSize = account.limits?.upload.upload_limit_max_non_media_file_size || -1;
      this.maxMediaFileSize = account.limits?.upload.upload_limit_max_media_file_size || -1;
    });

    this.setTitleIndex();
  }

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  setTitleIndex() {
    const prevTitleIndex = Number.parseInt(localStorage.getItem(CONTEXT_BOX_TITLE_INDEX) || '0');
    const titleIndex = prevTitleIndex < TOTAL_TITLES ? prevTitleIndex + 1 : 1;
    this.titleIndex.set(titleIndex);
    localStorage.setItem(CONTEXT_BOX_TITLE_INDEX, titleIndex.toString());
  }

  uploadFiles(files: File[]) {
    if (this.step() === 1) {
      this.step.set(2);
    }
    if (this.step() === 3 && this.view() !== 'resources') {
      this.view.set('resources');
    }
    this.contextBoxService.uploadFiles(files);
  }

  onFilesSelected(files: File[] | FileList | DroppedFile[]) {
    const fileTypes = getFilesGroupedByType(files);
    const mediaFilesNotSupported = this.maxMediaFileSize === 1;
    if (mediaFilesNotSupported) {
      fileTypes.mediaFiles = [];
      this.toaster.warning(this.translate.instant('context-box.no-media-files'));
    }
    const filesWithinLimits = fileTypes.nonMediaFiles.filter(
      (file) => this.maxFileSize === -1 || file.size <= this.maxFileSize,
    );
    const mediaFilesWithinLimits = fileTypes.mediaFiles.filter(
      (file) => this.maxMediaFileSize === -1 || file.size <= this.maxMediaFileSize,
    );
    if (filesWithinLimits.length < fileTypes.nonMediaFiles.length) {
      this.toaster.warning(
        this.translate.instant('context-box.file-size-limit', { size: this.sizePipe.transform(this.maxFileSize) }),
      );
    }
    if (mediaFilesWithinLimits.length < fileTypes.mediaFiles.length) {
      this.toaster.warning(
        this.translate.instant('context-box.media-file-size-limit', {
          size: this.sizePipe.transform(this.maxMediaFileSize),
        }),
      );
    }
    this.uploadFiles([...mediaFilesWithinLimits, ...filesWithinLimits]);
  }

  goToStep3() {
    this.step.set(3);
    this.initWidget();
  }

  initWidget() {
    this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG, {
      ...DEFAULT_WIDGET_CONFIG,
      displaySearchButton: true,
      chatSubmitButton: true,
      widgetMode: 'chat',
      hideReset: true,
      customizeChatPlaceholder: true,
      chatPlaceholder: this.translate.instant('context-box.search-placeholder'),
    });
    of(true)
      .pipe(
        delay(1000), // Wait for the widget to be rendered
      )
      .subscribe(() => {
        const element = document.querySelector('nuclia-chat');
        element?.addEventListener('chat', () => this.view.set('search'));
        element?.addEventListener('logs', (event: any) => this.logs.next(event.detail));
      });
  }

  resetSearch() {
    this.searchWidgetService.resetSearchQuery();
    this.initWidget();
  }

  changeView(view: 'resources') {
    if (this.view() === 'search') {
      this.resetSearch();
    }
    this.view.set(view);
  }

  showResources() {
    this.modalService.openModal(ResourceTableModalComponent);
  }

  showHistory() {
    this.modalService.openModal(HistoryTableModalComponent).onClose.subscribe((resourceId) => {
      if (resourceId) {
        this.openConversation(resourceId);
      }
    });
  }

  showMcpEndpoint() {
    this.modalService.openModal(McpEndpointModalComponent);
  }

  openConversation(resourceId: string) {
    this.contextBoxService.getChatEntries(resourceId).subscribe((entries) => {
      const element = document.querySelector('nuclia-chat');
      (element as any)?.setChat(entries);
      this.currentConversation = resourceId;
      this.view.set('search');
    });
  }

  private resumeShareFileOAuthIfNeeded() {
    const externalConnectionId = this.route.snapshot.paramMap.get('externalConnectionId');
    if (!externalConnectionId) return;

    localStorage.removeItem(PENDING_NEW_CONNECTOR_KEY);
    this.shareFileService
      .getExternalConnection(externalConnectionId)
      .pipe(
        catchError(() => {
          this.toaster.error(this.translate.instant('context-box.sharefile.connect-error'));
          // Nothing left to resume: return to the clean URL right away.
          this.router.navigate(['..'], { relativeTo: this.route });
          return of(undefined);
        }),
      )
      .subscribe((externalConnection) => {
        if (externalConnection) {
          this.openShareFileFolderPicker(externalConnection);
        }
      });
  }

  connectShareFile() {
    this.shareFileService.connectShareFile().subscribe((authorizeUrl) => {
      window.location.href = authorizeUrl;
    });
  }

  disconnectShareFile() {
    const syncId = this.connectedSource()?.id;
    if (!syncId) {
      return;
    }
    this.modalService
      .openConfirm({
        title: 'context-box.sharefile.disconnect-confirm-title',
        description: 'context-box.sharefile.disconnect-confirm-description',
        confirmLabel: 'context-box.sharefile.disconnect-confirm-label',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => result),
        switchMap(() => this.shareFileService.disconnectShareFile(syncId)),
        tap(() => this.contextBoxService.forceRefresh()),
        catchError(() => {
          this.toaster.error(this.translate.instant('context-box.sharefile.disconnect-error'));
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private openShareFileFolderPicker(externalConnection: ExternalConnection) {
    this.modalService
      .openModal(ShareFileFolderModalComponent, new ModalConfig({ data: { externalConnection } }))
      .onClose.pipe(
        filter((selection): selection is ShareFileFolderSelection => !!selection),
        switchMap((selection) => this.shareFileService.createShareFileSync(externalConnection.id, selection)),
        catchError(() => {
          this.toaster.error(this.translate.instant('context-box.sharefile.connect-error'));
          return of(undefined);
        }),
        finalize(() => this.router.navigate(['..'], { relativeTo: this.route })),
      )
      .subscribe((sync) => {
        if (sync) {
          this.toaster.success(this.translate.instant('context-box.sharefile.connect-success'));
          this.contextBoxService.forceRefresh();
          if (this.step() === 1) {
            this.step.set(2);
          }
        }
      });
  }
}
