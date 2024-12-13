import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../paragraph.service';
import {
  FIELD_TYPE,
  FieldId,
  FileFieldData,
  IError,
  Message,
  MessageAttachment,
  Paragraph,
  Resource,
  TextField,
  TypeParagraph,
} from '@nuclia/core';
import {
  getConversationParagraphs,
  getErrors,
  getMessages,
  getParagraphs,
  getParagraphsWithImages,
  getTotalMessagePages,
  ParagraphWithText,
  ParagraphWithTextAndImage,
  Thumbnail,
} from '../edit-resource.helpers';
import { SDKService } from '@flaps/core';
import { SafeHtml } from '@angular/platform-browser';
import { EditResourceService } from '../edit-resource.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceNavigationService } from '../resource-navigation.service';
import { PreviewService } from './preview.service';

const viewerId = 'viewer-widget';

@Component({
  templateUrl: './preview.component.html',
  styleUrls: ['../common-page-layout.scss', './preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  unsubscribeAll = new Subject<void>();
  paragraphs: Observable<ParagraphWithText[]> = this.paragraphService.paragraphList;
  jsonTextField = this.editResourceService.currentFieldData.pipe(
    map((field) =>
      !!field && !!field.value && (field.value as TextField).format === 'JSON'
        ? JSON.stringify(JSON.parse((field!.value as TextField).body), null, 2)
        : '',
    ),
  );

  viewerWidget: Observable<SafeHtml> = this.previewService.viewerWidget.pipe(takeUntil(this.unsubscribeAll));

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
  summary = this.resource.pipe(map((resource) => (resource.summary || '').replace(/\n/g, '<br>')));

  private _noField = new ReplaySubject<boolean>(1);
  noField: Observable<boolean> = this._noField.asObservable();

  thumbnails: Observable<Thumbnail[]> = this.resource.pipe(
    switchMap((res) => this.editResource.getThumbnails(this.editResource.getThumbnailsAndImages(res))),
  );
  hasThumbnail: Observable<boolean> = this.thumbnails.pipe(map((thumbnails) => thumbnails.length > 0));

  selectedTypes = new BehaviorSubject<TypeParagraph[]>([]);
  paragraphTypes = this.paragraphs.pipe(
    map((paragraphs) =>
      paragraphs
        .filter((paragraph) => paragraph.kind)
        .map((paragraph) => paragraph.kind as TypeParagraph)
        .reduce((kinds, kind) => (kinds.includes(kind) ? kinds : [...kinds, kind]), [] as TypeParagraph[]),
    ),
  );
  renderedParagraphs: Observable<(ParagraphWithTextAndImage & { url?: Observable<string> })[]> = combineLatest([
    this.paragraphs,
    this.fieldId,
    this.editResourceService.currentFieldData,
  ]).pipe(
    map(([paragraphs, fieldType, fieldData]) => {
      if (fieldType.field_type !== FIELD_TYPE.file) {
        return paragraphs;
      } else {
        return getParagraphsWithImages(paragraphs, fieldData as FileFieldData);
      }
    }),
    map((paragraphs) => {
      return (paragraphs as ParagraphWithTextAndImage[]).map((paragraph) => {
        if (paragraph.imagePath) {
          return { ...paragraph, url: this.getGeneratedFileUrl(paragraph.imagePath) };
        } else {
          return paragraph;
        }
      });
    }),
  );
  filteredParagraphs = combineLatest([this.renderedParagraphs, this.selectedTypes]).pipe(
    map(([paragraphs, types]) =>
      types.length === 0
        ? paragraphs
        : paragraphs.filter((paragraph) => paragraph.kind && types.includes(paragraph.kind)),
    ),
  );

  questionsAnswers = this.editResourceService.currentFieldData.pipe(
    map((field) => field?.extracted?.question_answers?.question_answers.question_answer),
  );
  selectedTab: 'content' | 'questions-answers' = 'content';

  currentFieldId?: FieldId;

  messages = new BehaviorSubject<Message[] | null>(null);
  messagePage = new BehaviorSubject<number>(1);
  hasMoreMessages = combineLatest([this.fieldId, this.resource, this.messagePage]).pipe(
    map(([fieldId, resource, messagePage]) => getTotalMessagePages(fieldId, resource) > messagePage),
  );
  attachments = this.messages.pipe(
    map((messages) =>
      (messages || []).reduce(
        (acc, curr) => {
          acc[curr.ident] =
            (curr.content.attachments_fields || []).length > 0 ? curr.content.attachments_fields : undefined;
          return acc;
        },
        {} as { [key: string]: MessageAttachment[] | undefined },
      ),
    ),
  );

  constructor(
    private editResource: EditResourceService,
    private paragraphService: ParagraphService,
    private editResourceService: EditResourceService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private resourceNavigation: ResourceNavigationService,
    private previewService: PreviewService,
  ) {
    this.resourceNavigation.currentRoute = this.route;
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('preview');

    combineLatest([this.fieldId, this.resource])
      .pipe(
        switchMap(([fieldId, resource]) => {
          if (fieldId.field_type === FIELD_TYPE.conversation) {
            this.messagePage.next(1);
            return getMessages(fieldId, resource, 1).pipe(map((messages) => ({ fieldId, resource, messages })));
          } else {
            return of({ fieldId, resource, messages: null });
          }
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ fieldId, resource, messages }) => {
        this.messages.next(messages);
        this.currentFieldId = fieldId;
        this.errors = getErrors(fieldId, resource);
        this.selectedTab = 'content';
        this.initParagraphs(fieldId, resource, messages);
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

  initParagraphs(fieldId: FieldId, resource: Resource, messages: Message[] | null) {
    const paragraphs: Paragraph[] = messages
      ? getConversationParagraphs(fieldId, resource, messages)
      : getParagraphs(fieldId, resource);
    const enhancedParagraphs: ParagraphWithText[] = paragraphs.map((paragraph) => ({
      ...paragraph,
      paragraphId: this.editResource.getParagraphId(fieldId, paragraph),
      text: resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph),
    }));
    this.paragraphService.setupParagraphs(enhancedParagraphs);
    this.cdr.markForCheck();
  }

  openViewer() {
    this.loadingPreview = true;
    if (this.currentFieldId) {
      const fieldId = this.currentFieldId;
      this.resource
        .pipe(
          take(1),
          switchMap((resource) => this.previewService.openViewer({ ...fieldId, resourceId: resource.id })),
          filter((isPreviewing) => !!isPreviewing),
          take(1),
        )
        .subscribe(() => {
          this.loadingPreview = false;
          this.cdr.markForCheck();
        });
    }
  }

  onClickOption(type: TypeParagraph, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      this.toggleType(type);
    }
  }

  toggleType(type: TypeParagraph) {
    this.selectedTypes.next(
      this.selectedTypes.value.includes(type)
        ? this.selectedTypes.value.filter((item) => item !== type)
        : [...this.selectedTypes.value, type],
    );
  }

  getGeneratedFileUrl(path: string) {
    return this.sdk.currentKb.pipe(
      switchMap((kb) =>
        (kb.state === 'PUBLISHED' ? of('') : kb.getTempToken()).pipe(
          map((token) => this.sdk.nuclia.rest.getFullUrl(path + (token ? `?eph-token=${token}` : ''))),
        ),
      ),
    );
  }

  loadMoreMessages() {
    const nextPage = this.messagePage.getValue() + 1;
    this.messagePage.next(nextPage);
    combineLatest([this.fieldId, this.resource])
      .pipe(
        take(1),
        switchMap(([fieldId, resource]) =>
          getMessages(fieldId, resource, nextPage).pipe(map((messages) => ({ fieldId, resource, messages }))),
        ),
      )
      .subscribe(({ fieldId, resource, messages }) => {
        const newMessages = (this.messages.getValue() || []).concat(messages || []);
        this.messages.next(newMessages);
        this.initParagraphs(fieldId, resource, newMessages);
      });
  }

  navigateToField(attachment: MessageAttachment) {
    const path = `../../${attachment.field_type}/${attachment.field_id}`;
    this.router.navigate([path], { relativeTo: this.route });
  }
}
