import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  combineLatest,
  distinctUntilKeyChanged,
  filter,
  map,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../paragraph.service';
import { FIELD_TYPE, FieldId, IError, Paragraph, Resource, TextField } from '@nuclia/core';
import { getErrors, getParagraphs, ParagraphWithText, Thumbnail } from '../edit-resource.helpers';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { EditResourceService } from '../edit-resource.service';
import { ActivatedRoute } from '@angular/router';

const viewerId = 'viewer-widget';

@Component({
  templateUrl: './preview.component.html',
  styleUrls: ['../common-page-layout.scss', './preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);

  unsubscribeAll = new Subject<void>();
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
        account="${account.id}"
        lang="${this.translate.currentLang}"
        ${this.sdk.nuclia.options.standalone ? 'standalone="true"' : ''}
        ></nuclia-viewer>`);
    }),
  );

  loaded = false;
  loadingPreview = false;
  errors?: IError | null;

  resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
  );
  isOnResourcePage: Observable<any> = this.route.params.pipe(
    map((params) => !params['fieldId'] && !params['fieldType']),
  );
  fieldId: Observable<FieldId> = this.route.params.pipe(
    filter((params) => !!params['fieldType'] && !!params['fieldId']),
    map((params) => {
      const field: FieldId = { field_id: params['fieldId'], field_type: params['fieldType'] };
      this.editResource.setCurrentField(field);
      return field;
    }),
  );
  extraMetadata = this.resource.pipe(map((resource) => JSON.stringify(resource.extra?.metadata, null, 2)));
  extraMetadataFullscreen = false;

  private _noField = new ReplaySubject<boolean>(1);
  noField: Observable<boolean> = this._noField.asObservable();

  thumbnails: Observable<Thumbnail[]> = this.resource.pipe(
    switchMap((res) => this.editResource.getThumbnails(this.editResource.getThumbnailsAndImages(res))),
  );
  hasThumbnail: Observable<boolean> = this.thumbnails.pipe(map((thumbnails) => thumbnails.length > 0));

  currentFieldId?: FieldId;

  constructor(
    private editResource: EditResourceService,
    private paragraphService: ParagraphService,
    private editResourceService: EditResourceService,
    private sdk: SDKService,
    private sanitizer: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('preview');

    combineLatest([this.fieldId, this.resource])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource]) => {
        this.currentFieldId = fieldId;
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

    this.isOnResourcePage
      .pipe(
        filter((isResourcePage) => isResourcePage),
        switchMap(() => this.editResourceService.fields),
        map((fields) => fields.filter((field) => field.field_type !== FIELD_TYPE.generic)),
        filter((fields) => fields.length === 1),
        map((fields) => fields[0]),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((field) => {
        this.currentFieldId = field;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.paragraphService.cleanup();
    const viewerElement = document.querySelector('nuclia-viewer') as any;
    if (typeof viewerElement?.$$c?.$destroy === 'function') {
      viewerElement.$$c.$destroy();
    }
  }

  openViewer() {
    this.loadingPreview = true;
    if (this.currentFieldId) {
      const fieldId = this.currentFieldId;
      this.resource
        .pipe(
          take(1),
          switchMap(
            (resource) =>
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
}
