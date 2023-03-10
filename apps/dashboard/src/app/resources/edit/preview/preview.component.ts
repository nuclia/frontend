import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SelectFirstFieldDirective } from '../select-first-field/select-first-field.directive';
import { combineLatest, distinctUntilKeyChanged, filter, forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../paragraph.service';
import { Paragraph } from '@nuclia/core';
import { getParagraphs, ParagraphWithText } from '../edit-resource.helpers';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

const viewerId = 'viewer-widget';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['../common-page-layout.scss', './preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  paragraphs: Observable<ParagraphWithText[]> = this.paragraphService.paragraphList;

  viewerWidget: Observable<SafeHtml> = this.sdk.currentKb.pipe(
    distinctUntilKeyChanged('id'),
    tap(() => document.getElementById(viewerId)?.remove()),
    map((kb) => {
      return this.sanitizer.bypassSecurityTrustHtml(`<nuclia-viewer id="viewer-widget"
        knowledgebox="${kb.id}"
        zone="${this.sdk.nuclia.options.zone}"
        client="dashboard"
        cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
        backend="${this.backendConfig.getAPIURL()}"
        state="${kb.state || ''}"
        kbslug="${kb.slug || ''}"
        account="${kb.account || ''}"
        lang="${this.translate.currentLang}"
        ></nuclia-viewer>`);
    }),
  );

  loaded = false;
  loadingPreview = false;

  constructor(
    private paragraphService: ParagraphService,
    private sdk: SDKService,
    private sanitizer: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('preview');

    combineLatest([this.fieldId, this.resource])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource]) => {
        this.loaded = true;
        const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
        const enhancedParagraphs: ParagraphWithText[] = paragraphs.map((paragraph) => ({
          ...paragraph,
          paragraphId: this.editResource.getParagraphId(fieldId, paragraph),
          text: resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph),
        }));
        this.paragraphService.setupParagraphs(enhancedParagraphs);
      });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.paragraphService.cleanup();
    const viewerElement = document.querySelector('nuclia-viewer') as any;
    if (typeof viewerElement?.$destroy === 'function') {
      viewerElement.$destroy();
    }
  }

  openViewer() {
    this.loadingPreview = true;
    forkJoin([this.fieldId.pipe(take(1)), this.resource.pipe(take(1))])
      .pipe(
        switchMap(([fieldId, resource]) =>
          (document.getElementById(viewerId) as unknown as any)?.openPreview(
            { ...fieldId, resourceId: resource.id },
            resource.title,
          ),
        ),
        filter((isPreviewing) => !!isPreviewing),
        take(1),
      )
      .subscribe(() => {
        this.loadingPreview = false;
        this.cdr.markForCheck();
      });
  }
}
