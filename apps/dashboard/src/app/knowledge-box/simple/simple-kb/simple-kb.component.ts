import { ChangeDetectionStrategy, computed, Component, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DEFAULT_WIDGET_CONFIG, getFilesGroupedByType, SearchWidgetService } from '@flaps/common';
import { map, take, of, delay, Subject, filter, distinctUntilChanged, switchMap, tap, combineLatest } from 'rxjs';
import { DroppedFile, FeaturesService, SDKService, SizePipe } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { SimpleKBService } from './simple-kb.service';
import { McpEndpointModalComponent } from '../mcp-endpoint/mcp-endpoint-modal.component';
import { getCoworkTrialState } from '../simple.utils';

@Component({
  standalone: false,
  selector: 'app-simple-kb',
  templateUrl: './simple-kb.component.html',
  styleUrls: ['./simple-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SizePipe],
})
export class SimpleKBComponent implements OnDestroy {
  private simpleKBService = inject(SimpleKBService);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private sdk = inject(SDKService);
  private sizePipe = inject(SizePipe);
  private features = inject(FeaturesService);

  widgetPreview = this.searchWidgetService.widgetPreview;
  maxFiles = this.simpleKBService.maxFiles;
  logs = new Subject<any>();

  uploadInProgress = toSignal(this.simpleKBService.uploadInProgress, { initialValue: false });
  counter = toSignal(this.simpleKBService.resourceCounter);
  step = signal<number>(-1);
  fileOver = signal(false);
  maxFileSize = -1;
  maxMediaFileSize = -1;

  view = signal<'resources' | 'history' | 'search'>('resources');
  currentConversation?: string;

  private trialState = toSignal(this.sdk.currentAccount.pipe(map(getCoworkTrialState)), {
    initialValue: { isCoworkTrial: false, isTrialExpired: false, isAtEquator: false, daysLeft: 0 },
  });

  isCoworkTrial = computed(() => this.trialState().isCoworkTrial);
  isAtEquator = computed(() => this.trialState().isAtEquator);

  constructor() {
    this.simpleKBService.resources.pipe(take(1)).subscribe((resources) => {
      if (resources.length === 0) {
        this.step.set(1);
      } else {
        this.goToStep3();
      }
    });

    // Auto-advance from step 2 to step 3 once resources are confirmed processed.
    this.simpleKBService.resourceCounter
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
            ? this.simpleKBService.appendQuestion(
                this.currentConversation || '',
                event['lastQuery'].params.query,
                event['lastResults']?.text || '',
                event['lastResults']?.text ? event['lastResults'] : undefined,
              )
            : this.simpleKBService
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
    const allowedMediaFiles = fileTypes.mediaFiles.filter((file) => {
      const type = file.type?.split('/')[0];
      return type !== 'audio' && type !== 'video';
    });
    if (allowedMediaFiles.length < fileTypes.mediaFiles.length) {
      this.toaster.warning(this.translate.instant('simple.no-video-audio'));
    }
    const filesWithinLimits = fileTypes.nonMediaFiles.filter(
      (file) => this.maxFileSize === -1 || file.size <= this.maxFileSize,
    );
    const mediaFilesWithinLimits = allowedMediaFiles.filter(
      (file) => this.maxMediaFileSize === -1 || file.size <= this.maxMediaFileSize,
    );
    if (filesWithinLimits.length < fileTypes.nonMediaFiles.length) {
      this.toaster.warning(
        this.translate.instant('simple.file-size-limit', { size: this.sizePipe.transform(this.maxFileSize) }),
      );
    }
    if (mediaFilesWithinLimits.length < allowedMediaFiles.length) {
      this.toaster.warning(
        this.translate.instant('simple.media-file-size-limit', {
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
      widgetMode: 'chat',
      hideReset: true,
      customizeChatPlaceholder: true,
      chatPlaceholder: this.translate.instant('simple.search-placeholder'),
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

  changeView(view: 'resources' | 'history') {
    if (this.view() === 'search') {
      this.resetSearch();
    }
    this.view.set(view);
  }

  showMcpEndpoint() {
    this.modalService.openModal(McpEndpointModalComponent);
  }

  openConversation(resourceId: string) {
    this.simpleKBService.getChatEntries(resourceId).subscribe((entries) => {
      const element = document.querySelector('nuclia-chat');
      (element as any)?.setChat(entries);
      this.currentConversation = resourceId;
      this.view.set('search');
    });
  }
}
