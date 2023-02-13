import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { SelectFirstFieldDirective } from '../select-first-field/select-first-field.directive';
import { combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ParagraphService } from '../paragraph.service';
import { Paragraph } from '@nuclia/core';
import { getParagraphs, ParagraphWithText } from '../edit-resource.helpers';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['../common-page-layout.scss', './preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  paragraphs: Observable<ParagraphWithText[]> = this.paragraphService.paragraphList;

  constructor(private paragraphService: ParagraphService) {
    super();
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('preview');

    combineLatest([this.fieldId, this.resource])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([fieldId, resource]) => {
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
  }

  openViewer() {}
}
