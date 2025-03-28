import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, SisLabelModule } from '@nuclia/sistema';
import { SDKService } from '@flaps/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TestResults } from '../task-testing.component';
import {
  ExtractedDataTypes,
  FIELD_TYPE,
  ResourceProperties,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
  TaskApplyTo,
} from '@nuclia/core';
import { map, ReplaySubject, switchMap, take } from 'rxjs';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { getParagraphId, ParagraphWithText } from 'libs/common/src/lib/resources';
import { DataAugmentationTaskOnGoing } from '../../../tasks-automation.models';

@Component({
  selector: 'app-labeler-results',
  imports: [CommonModule, InfoCardComponent, PaButtonModule, SisLabelModule, TranslateModule],
  templateUrl: './labeler-results.component.html',
  styleUrl: './labeler-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelerResultsComponent {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);

  resultsSubject = new ReplaySubject<TestResults>(1);
  expanded: { [paragraphId: string]: boolean | undefined } = {};
  TaskApplyTo = TaskApplyTo;

  @Input({ required: true })
  set results(value: TestResults | undefined) {
    if (value) {
      this.resultsSubject.next(value);
    }
  }

  @Input({ required: true }) task: DataAugmentationTaskOnGoing | undefined;

  fieldsWithLabels = this.resultsSubject.pipe(
    map((results) => {
      const labelOperation = this.task?.parameters.operations?.[0].label;
      const taskLabels = (labelOperation?.labels || []).map((label) => `${labelOperation?.ident || ''}/${label.label}`);
      return Object.entries(results.results)
        .filter(([key]) => this.getFieldId(key).fieldType !== FIELD_TYPE.generic)
        .map(([key, field]) => ({
          key,
          title: this.getFieldTitle(key),
          labels: field.metadata.classifications.filter((label) =>
            taskLabels.includes(`${label.labelset}/${label.label}`),
          ),
        }))
        .filter((field) => field.labels.length > 0);
    }),
  );

  paragraphsWithLabels = this.resultsSubject.pipe(
    switchMap((results) =>
      this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          kb.getResource(
            results.resource.id,
            [ResourceProperties.BASIC, ResourceProperties.EXTRACTED],
            [ExtractedDataTypes.TEXT],
          ),
        ),
        map((resource) => {
          const labelOperation = this.task?.parameters.operations?.[0].label;
          const taskLabels = (labelOperation?.labels || []).map(
            (label) => `${labelOperation?.ident || ''}/${label.label}`,
          );
          return Object.entries(results.results)
            .map(([key, field]) => ({ ...this.getFieldId(key), field }))
            .filter(({ fieldType }) => fieldType !== FIELD_TYPE.generic)
            .reduce(
              (acc, { fieldType, fieldId, field }) =>
                acc.concat(
                  field.metadata.paragraphs.map((paragraph) => ({
                    ...paragraph,
                    classifications: paragraph.classifications?.filter((label) =>
                      taskLabels.includes(`${label.labelset}/${label.label}`),
                    ),
                    paragraphId: getParagraphId(resource.id, { field_type: fieldType, field_id: fieldId }, paragraph),
                    text: resource.getParagraphText(fieldType, fieldId, paragraph),
                  })),
                ),
              [] as ParagraphWithText[],
            )
            .filter((paragraph) => (paragraph.classifications || []).length > 0);
        }),
      ),
    ),
  );

  expandParagraph(id: string) {
    this.expanded[id] = !this.expanded[id];
  }

  getFieldId(key: string) {
    return {
      fieldType: shortToLongFieldType(key[0] as SHORT_FIELD_TYPE) as FIELD_TYPE,
      fieldId: key.split('/')[1],
    };
  }

  getFieldTitle(key: string) {
    return key.startsWith('t/da-')
      ? key.split('-')[1] || ''
      : this.translate.instant('resource.field-' + shortToLongFieldType(key[0] as SHORT_FIELD_TYPE) || '');
  }
}
