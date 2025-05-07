import { inject, Injectable } from '@angular/core';
import { combineLatest, distinctUntilKeyChanged, map, Observable, tap } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { ResourceViewerService } from '../../resource-viewer.service';

const viewerId = 'viewer-widget';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private sdk = inject(SDKService);
  private sanitizer = inject(DomSanitizer);
  private backendConfig = inject(BackendConfigurationService);
  private translate = inject(TranslateService);
  private viewerService = inject(ResourceViewerService);

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
        kbslug="${kb.slug || ''}"
        account="${account.id}"
        lang="${this.translate.currentLang}"
        ${this.sdk.nuclia.options.standalone ? 'standalone="true"' : ''}
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
}
