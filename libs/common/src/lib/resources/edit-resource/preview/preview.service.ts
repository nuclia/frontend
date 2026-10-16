import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { FieldId, Resource } from '@nuclia/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilKeyChanged,
  filter,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { ResourceViewerService } from '../../resource-viewer.service';

const viewerId = 'viewer-widget';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private sdk = inject(SDKService);
  private sanitizer = inject(DomSanitizer);
  private backendConfig = inject(BackendConfigurationService);
  private translate = inject(TranslateService);
  private viewerService = inject(ResourceViewerService);

  private _viewerState = new BehaviorSubject<{ available: boolean; loading: boolean }>({
    available: false,
    loading: false,
  });
  private _viewerRequested = new Subject<void>();

  /** Whether the previewed field can be opened in the viewer, published by the preview page for the toolbar */
  viewerState = this._viewerState.asObservable();
  viewerRequested = this._viewerRequested.asObservable();

  setViewerState(state: { available: boolean; loading: boolean }) {
    this._viewerState.next(state);
  }

  requestViewer() {
    this._viewerRequested.next();
  }

  viewerWidget: Observable<SafeHtml> = combineLatest([
    this.sdk.currentKb.pipe(distinctUntilKeyChanged('id')),
    this.sdk.currentAccount.pipe(distinctUntilKeyChanged('id')),
  ]).pipe(
    tap(() => document.getElementById(viewerId)?.remove()),
    map(([kb, account]) => {
      return this.sanitizer.bypassSecurityTrustHtml(`<nuclia-viewer id="viewer-widget"
        knowledgebox="${kb.id}"
        features="knowledgeGraph"
        zone="${this.sdk.nuclia.options.zone}"
        client="dashboard"
        cdn="${this.backendConfig.getCDN() + '/'}"
        backend="${this.backendConfig.getAPIURL()}"
        state="${kb.state || ''}"
        account="${account.id}"
        lang="${this.translate.getCurrentLang()}"
        ></nuclia-viewer>`);
    }),
    tap(() => {
      // wait for the widget to render
      setTimeout(() => this.initViewer(), 100);
    }),
  );

  initViewer() {
    this.viewerService.handleBackButton(document.getElementById(viewerId));
  }

  openViewer(fullFieldId: { resourceId: string; field_id: string; field_type: string }): Observable<boolean> {
    return (document.getElementById(viewerId) as unknown as any)?.openPreview(fullFieldId);
  }

  processAgenticQuestion(
    resource: Resource | null,
    fieldId: FieldId,
    question: string,
    agentic_config_id: string,
  ): Observable<string> {
    return this.sdk.currentKb.pipe(
      switchMap((kb) => kb.ask(question, undefined, undefined, { agentic_config_id, citations: false })),
      filter((res) => res.type === 'answer' && !res.incomplete),
      switchMap((result) => {
        if (resource && result.type === 'answer') {
          return resource
            .setField(fieldId.field_type, fieldId.field_id, {
              body: JSON.stringify({ question, agentic_config_id, answer: result.text }),
              format: 'JSON',
            })
            .pipe(map(() => result.text));
        } else {
          return of('');
        }
      }),
    );
  }
}
