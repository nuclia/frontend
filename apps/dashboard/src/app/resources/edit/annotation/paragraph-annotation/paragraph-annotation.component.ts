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
  getAllAnnotations,
  getAnnotatedText,
  getHighlightedAnnotations,
  getParagraphAnnotations,
  getParagraphs,
  isSameAnnotation,
  ParagraphWithTextAndAnnotations,
  sortByPosition,
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
  userSelection?: EntityAnnotation & { paragraphId: string };
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
          const allAnnotations = getAllAnnotations(resource, fieldId, families);
          const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
          return paragraphs.map((paragraph) => {
            const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
            const allParagraphAnnotations = getParagraphAnnotations(allAnnotations, paragraph);
            const highlightedAnnotation = getHighlightedAnnotations(allParagraphAnnotations);
            const paragraphText = resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph);
            const enhancedParagraph: ParagraphWithTextAndAnnotations = {
              ...paragraph,
              paragraphId,
              text: paragraphText,
              annotatedText: getAnnotatedText(paragraphId, paragraphText, highlightedAnnotation),
              annotations: allParagraphAnnotations,
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
    this.isSaving = true;
    this.selectedEntity = undefined;
    this.selectedFamily.next(null);
    this.fieldId.pipe(switchMap((field) => this.editResource.saveAnnotations(field, this.paragraphs))).subscribe({
      next: () => {
        this.isModified = false;
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: () => (this.isSaving = false),
    });
  }

  cancel() {
    this.paragraphs = this.paragraphsBackup.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
    const selectedFamily = this.selectedFamily.value;
    if (selectedFamily) {
      this.updateParagraphsWithAnnotations(selectedFamily);
    }
    this.isModified = false;
  }

  selectFamily(family: EntityGroup) {
    const selectedFamily = this.selectedFamily.value?.id === family.id ? null : family;
    this.selectedFamily.next(selectedFamily);
    this.updateParagraphsWithAnnotations(selectedFamily);
  }

  removeEntityFromParagraph(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.selectedEntity || !this.selectedFamily.value) {
      return;
    }
    const selection = this.selectedEntity;
    if (this.selectedEntity.immutable) {
      paragraph.annotations.push({
        ...this.selectedEntity,
        cancelled_by_user: true,
        immutable: false,
      });
    } else {
      const annotationIndex = paragraph.annotations.findIndex((annotation) => isSameAnnotation(annotation, selection));
      if (annotationIndex > -1) {
        paragraph.annotations.splice(annotationIndex, 1);
      }
    }
    this.updateParagraphsWithAnnotations(this.selectedFamily.value);
    // Unselect the deleted entity
    this.selectedEntity = undefined;
    this.isModified = this.hasModifications();
  }

  addEntity(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.userSelection) {
      return;
    }
    paragraph.annotations.push(this.userSelection);
    paragraph.annotations.sort(sortByPosition);
    this.updateParagraphsWithAnnotations(this.selectedFamily.value);
    this.isModified = this.hasModifications();
    this.cleanupSelection();
  }

  updateEntity(paragraph: ParagraphWithTextAndAnnotations) {
    if (!this.selectedEntity || !this.selectedFamily.value) {
      return;
    }
    const family: EntityGroup = this.selectedFamily.value;
    const selection = this.selectedEntity;
    const newEntity = {
      start: this.selectedEntity.start,
      end: this.selectedEntity.end,
      klass: family.id,
      token: this.selectedEntity.token,
      family: family.title,
    };
    if (this.selectedEntity.immutable) {
      paragraph.annotations.push(
        {
          ...this.selectedEntity,
          immutable: false,
          cancelled_by_user: true,
        },
        newEntity,
      );
    } else {
      const annotationIndex = paragraph.annotations.findIndex((annotation) => isSameAnnotation(annotation, selection));
      if (annotationIndex > -1) {
        paragraph.annotations[annotationIndex] = newEntity;
      }
    }
    paragraph.annotations.sort(sortByPosition);
    this.updateParagraphsWithAnnotations(this.selectedFamily.value);
    this.isModified = this.hasModifications();
  }

  onMouseUp($event: MouseEvent) {
    const paragraph = $event.target as HTMLElement;
    const family = this.selectedFamily.value;
    const selection = window.getSelection();
    if (paragraph && family && selection && !selection.isCollapsed) {
      const paragraphRect = paragraph.getBoundingClientRect();
      this.buttonPosition = {
        top: `${$event.clientY - paragraphRect.bottom + 8}px`,
        left: `${$event.clientX - paragraphRect.left}px`,
      };

      const paragraphText = paragraph.textContent as string;
      const selectionText = selection.toString();
      const range = selection.getRangeAt(0);
      let start = range.startOffset;
      let end = range.endOffset;
      if (selectionText !== paragraphText.slice(start, end)) {
        const exactPosition = this.getExactPositionOfSelection(paragraphText, selectionText, range);
        if (exactPosition) {
          start = exactPosition.start;
          end = exactPosition.end;
        }
      }
      const paragraphId = paragraph.getAttribute('paragraphId') as string;
      this.userSelection = {
        paragraphId,
        start,
        end,
        klass: family.id,
        token: selectionText.replace(/\s+/gi, ' ').trim(),
        family: family.title,
      };
    } else {
      this.cleanupSelection();
    }
  }

  private getExactPositionOfSelection(
    paragraphText: string,
    selectionText: string,
    range: Range,
  ): { start: number; end: number } | null {
    const expression = selectionText.replace(/ /g, `\\s*`);
    const regexp = new RegExp(expression);
    const match = paragraphText.match(regexp);
    if (!match || !match.index) {
      return null;
    }

    return {
      start: match.index,
      end: match.index + (range.endOffset - range.startOffset),
    };
  }

  private cleanupSelection() {
    this.userSelection = undefined;
    this.buttonPosition = undefined;
    this.selectedEntity = undefined;
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
    const paragraph = mark.parentElement as HTMLElement;
    this.selectedEntity = {
      paragraphId: paragraph.getAttribute('paragraphId') || '',
      family: mark.getAttribute('title') || '',
      token: mark.getAttribute('token') || '',
      start: parseInt(mark.getAttribute('start') || '0', 10),
      end: parseInt(mark.getAttribute('end') || '0', 10),
      klass: mark.getAttribute('family') || '',
      immutable: mark.getAttribute('immutable') === 'true',
    };
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

  private updateParagraphsWithAnnotations(selectedFamily: null | EntityGroup) {
    this.paragraphs = this.paragraphs.map((paragraph) => {
      const highlightedAnnotations = getHighlightedAnnotations(paragraph.annotations);
      return {
        ...paragraph,
        annotatedText: getAnnotatedText(paragraph.paragraphId, paragraph.text, highlightedAnnotations, selectedFamily),
      };
    });
    setTimeout(() => {
      this.cleanUpMarkListener();
      this.setupMarkListener();
    });
  }

  private hasModifications() {
    return JSON.stringify(this.paragraphsBackup) !== JSON.stringify(this.paragraphs);
  }
}
