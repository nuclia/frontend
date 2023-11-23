import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SelectFirstFieldDirective } from '../select-first-field/select-first-field.directive';
import { combineLatest, distinctUntilKeyChanged, filter, forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../paragraph.service';
import { IError, Paragraph, TextField } from '@nuclia/core';
import { getErrors, getParagraphs, ParagraphWithText } from '../edit-resource.helpers';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { EditResourceService } from '../edit-resource.service';

const viewerId = 'viewer-widget';

@Component({
  templateUrl: './preview.component.html',
  styleUrls: ['../common-page-layout.scss', './preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  paragraphs: Observable<ParagraphWithText[]> = this.paragraphService.paragraphList;
  jsonTextField = this.editResourceService.currentFieldData.pipe(
    map((field) =>
      !!field && !!field.value && (field.value as TextField).format === 'JSON'
        ? JSON.stringify(JSON.parse((field!.value as TextField).body), null, 2)
        : '',
    ),
  );

  viewerWidget: Observable<SafeHtml> = combineLatest([
    this.sdk.currentKb.pipe(distinctUntilKeyChanged('id')),
    this.sdk.currentAccount,
  ]).pipe(
    tap(() => document.getElementById(viewerId)?.remove()),
    map(([kb, account]) => {
      return this.sanitizer.bypassSecurityTrustHtml(`<nuclia-viewer id="viewer-widget"
        knowledgebox="${kb.id}"
        zone="${this.sdk.nuclia.options.zone}"
        client="dashboard"
        cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
        backend="${this.backendConfig.getAPIURL()}"
        state="${kb.state || ''}"
        kbslug="${kb.slug || ''}"
        account="${this.sdk.useRegionalSystem ? account.id : kb.account || ''}"
        lang="${this.translate.currentLang}"
        ${this.sdk.nuclia.options.standalone ? 'standalone="true"' : ''}
        ></nuclia-viewer>`);
    }),
  );

  loaded = false;
  loadingPreview = false;
  errors?: IError | null;

  constructor(
    private paragraphService: ParagraphService,
    private editResourceService: EditResourceService,
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
        this.errors = getErrors(fieldId, resource);
        const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
        const enhancedParagraphs: ParagraphWithText[] = paragraphs.map((paragraph) => ({
          ...paragraph,
          paragraphId: this.editResource.getParagraphId(fieldId, paragraph),
          text: resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph),
        }));
        this.paragraphService.setupParagraphs(enhancedParagraphs);
        this.loaded = true;
        this.cdr.markForCheck();
      });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.paragraphService.cleanup();
    const viewerElement = document.querySelector('nuclia-viewer') as any;
    if (typeof viewerElement?.$$c?.$destroy === 'function') {
      viewerElement.$$c.$destroy();
    }
  }

  openViewer() {
    this.loadingPreview = true;
    forkJoin([this.fieldId.pipe(take(1)), this.resource.pipe(take(1))])
      .pipe(
        switchMap(
          ([fieldId, resource]) =>
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
