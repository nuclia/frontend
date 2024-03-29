import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BadgeComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { LabelModule, LabelSetFormModalComponent, LabelsService, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LabelSet, LabelSetKind, LabelSets, Search } from '@nuclia/core';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'stf-labeling-configuration',
  standalone: true,
  imports: [
    CommonModule,
    DropdownButtonComponent,
    InfoCardComponent,
    LabelModule,
    PaButtonModule,
    PaTogglesModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    BadgeComponent,
  ],
  templateUrl: './labeling-configuration.component.html',
  styleUrl: './labeling-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelingConfigurationComponent {
  private sdk = inject(SDKService);
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  private _type: 'resources' | 'text-blocks' = 'resources';
  @Input() set type(value: 'resources' | 'text-blocks') {
    this._type = value;
    this.labelSets = value === 'resources' ? this.labelService.resourceLabelSets : this.labelService.textBlockLabelSets;
  }
  get type() {
    return this._type;
  }

  labelSets?: Observable<LabelSets | null>;
  selectedLabelSet?: { id: string; labelSet: LabelSet };
  labeledResourceCount?: number;

  labelingOptionsForm = new FormGroup({
    labelingBy: new FormControl<'existing-labeling' | 'prompt'>('existing-labeling'),
    prompt: new FormControl<string>(''),
  });

  get labelingByValue() {
    return this.labelingOptionsForm.controls.labelingBy.value;
  }

  createLabelSet() {
    this.modalService
      .openModal(LabelSetFormModalComponent)
      .onClose.pipe(
        filter((labelset) => !!labelset),
        map((data) => data as { id: string; labelSet: LabelSet }),
      )
      .subscribe((data) => {
        if (
          (data.labelSet.kind[0] === LabelSetKind.RESOURCES && this.type === 'resources') ||
          (data.labelSet.kind[0] === LabelSetKind.PARAGRAPHS && this.type === 'text-blocks')
        ) {
          this.selectLabelSet(data);
        }
      });
  }

  selectLabelSet(data: { id: string; labelSet: LabelSet }) {
    this.selectedLabelSet = data;
    const facetId = `/classification.labels/${data.id}`;
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          this.type === 'resources'
            ? kb.catalog('', { faceted: [facetId] })
            : kb.search('', [Search.Features.PARAGRAPH], { faceted: [facetId] }),
        ),
      )
      .subscribe({
        next: (results) => {
          if (results.type === 'error') {
            this.toaster.error('tasks-automation.errors.counting-labeled-resources');
          } else {
            const facets: Search.FacetsResult =
              (this.type === 'resources' ? results.fulltext?.facets : results.paragraphs?.facets) || {};
            this.labeledResourceCount = Object.values(facets[facetId] || {}).reduce((count, value) => {
              return count + value;
            }, 0);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toaster.error('tasks-automation.errors.counting-labeled-resources');
        },
      });
  }
}
