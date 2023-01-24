import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { EditResourceService } from '../../edit-resource.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { FieldId, Paragraph, Resource } from '@nuclia/core';
import {
  EntityAnnotation,
  EntityGroup,
  getAnnotatedText,
  getGeneratedFieldAnnotations,
  getParagraphAnnotations,
  getParagraphs,
  ParagraphWithTextAndAnnotations,
} from '../../edit-resource.helpers';
import { takeUntil } from 'rxjs/operators';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-paragraph-annotation',
  templateUrl: './paragraph-annotation.component.html',
  styleUrls: ['./paragraph-annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphAnnotationComponent implements OnInit, OnDestroy {
  @ViewChild('paragraphsContainer') paragraphsContainer?: ElementRef<HTMLElement>;

  unsubscribeAll = new Subject<void>();

  private resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
  );
  private fieldId: Observable<FieldId> = this.route.params.pipe(
    filter((params) => !!params.fieldType && !!params.fieldId),
    map((params) => {
      const field: FieldId = { field_id: params.fieldId, field_type: params.fieldType };
      this.editResource.setCurrentField(field);
      return field;
    }),
  );

  isModified = false;
  isSaving = false;

  private paragraphsBackup: ParagraphWithTextAndAnnotations[] = [];
  paragraphs: ParagraphWithTextAndAnnotations[] = [];

  entityFamilies: Observable<EntityGroup[]> = this.editResource.loadResourceEntities();
  selectedFamily: BehaviorSubject<EntityGroup | null> = new BehaviorSubject<EntityGroup | null>(null);
  selectedEntity?: EntityAnnotation & { paragraphId: string };
  userSelection = false;
  buttonPosition?: { top: string; left: string };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editResource: EditResourceService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.params
      .pipe(
        filter((params) => !params.fieldId && !params.fieldType),
        switchMap(() => this.editResource.fields),
        filter((fields) => fields.length > 0),
      )
      .subscribe((fields) => {
        const field = fields[0];
        this.router.navigate([`./${field.field_type}/${field.field_id}`], { relativeTo: this.route });
      });
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('annotation');

    // Load paragraphs
    combineLatest([this.fieldId, this.resource, this.entityFamilies])
      .pipe(
        map(([fieldId, resource, families]) => {
          const generatedAnnotation: EntityAnnotation[] = getGeneratedFieldAnnotations(resource, fieldId, families);
          const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
          return paragraphs.map((paragraph) => {
            const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
            const annotations = getParagraphAnnotations(resource, fieldId, generatedAnnotation, paragraph, families);
            const paragraphText = resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph);
            const enhancedParagraph: ParagraphWithTextAndAnnotations = {
              ...paragraph,
              paragraphId,
              text: paragraphText,
              annotatedText: getAnnotatedText(paragraphId, paragraphText, annotations),
              annotations,
            };
            return enhancedParagraph;
          });
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((paragraphs) => {
        this.paragraphsBackup = paragraphs.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.paragraphs = this.paragraphsBackup.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.cdr.markForCheck();
        setTimeout(() => {
          this.setupMarkListener();
        });
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.cleanUpMarkListener();
  }

  save() {
    // TODO
  }

  cancel() {
    // TODO
  }

  selectFamily(family: EntityGroup) {
    const selectedFamily = this.selectedFamily.value?.id === family.id ? null : family;
    this.selectedFamily.next(selectedFamily);
    this.paragraphs = this.paragraphs.map((paragraph) => ({
      ...paragraph,
      annotatedText: getAnnotatedText(paragraph.paragraphId, paragraph.text, paragraph.annotations, selectedFamily),
    }));
    setTimeout(() => {
      this.cleanUpMarkListener();
      this.setupMarkListener();
    });
  }

  private setupMarkListener() {
    if (this.paragraphsContainer) {
      this.paragraphsContainer.nativeElement
        .querySelectorAll('mark[family]')
        .forEach((mark) => mark.addEventListener('click', this.clickOnAnnotation.bind(this)));
    }
  }

  private cleanUpMarkListener() {
    if (this.paragraphsContainer) {
      this.paragraphsContainer.nativeElement
        .querySelectorAll('mark[family]')
        .forEach((mark) => mark.removeEventListener('click', this.clickOnAnnotation.bind(this)));
    }
  }

  private clickOnAnnotation(event: Event) {
    if (!this.selectedFamily.value) {
      this.toaster.info('resource.field-annotation.select-family-before');
      return;
    }
    const mark = event.target as HTMLElement;
    this.selectedEntity = {
      paragraphId: mark.getAttribute('paragraphId') || '',
      family: mark.getAttribute('title') || '',
      token: mark.getAttribute('token') || '',
      start: parseInt(mark.getAttribute('start') || '0', 10),
      end: parseInt(mark.getAttribute('end') || '0', 10),
      klass: mark.getAttribute('family') || '',
    };
    const paragraph = mark.parentElement as HTMLElement;
    const paragraphRect = paragraph.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const buttonBlockWidth =
      !this.userSelection && this.selectedEntity.klass !== this.selectedFamily.value?.id ? 32 : 16;
    this.buttonPosition = {
      left: markRect.height < 16 ? `${markRect.right - paragraphRect.left - buttonBlockWidth}px` : '0',
      top: `${markRect.bottom - paragraphRect.bottom}px`,
    };
    this.cdr.markForCheck();
  }
}
