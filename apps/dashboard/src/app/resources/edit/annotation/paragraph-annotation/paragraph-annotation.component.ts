import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EditResourceService } from '../../edit-resource.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { FieldId, Paragraph, Resource } from '@nuclia/core';
import { getParagraphs, ParagraphWithText } from '../../edit-resource.helpers';

@Component({
  selector: 'app-paragraph-annotation',
  templateUrl: './paragraph-annotation.component.html',
  styleUrls: ['./paragraph-annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParagraphAnnotationComponent implements OnInit, OnDestroy {
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

  private paragraphsBackup: ParagraphWithText[] = [];
  paragraphs: ParagraphWithText[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editResource: EditResourceService,
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

    combineLatest([this.fieldId, this.resource])
      .pipe(
        map(([fieldId, resource]) => {
          const paragraphs: Paragraph[] = getParagraphs(fieldId, resource);
          return paragraphs.map((paragraph) => {
            const paragraphId = this.editResource.getParagraphId(fieldId, paragraph);
            const enhancedParagraph: ParagraphWithText = {
              ...paragraph,
              paragraphId,
              text: resource.getParagraphText(fieldId.field_type, fieldId.field_id, paragraph),
            };
            return enhancedParagraph;
          });
        }),
      )
      .subscribe((paragraphs) => {
        this.paragraphsBackup = paragraphs.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.paragraphs = this.paragraphsBackup.map((paragraph) => JSON.parse(JSON.stringify(paragraph)));
        this.cdr.markForCheck();
      });
  }
  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    // TODO
  }

  cancel() {
    // TODO
  }
}
