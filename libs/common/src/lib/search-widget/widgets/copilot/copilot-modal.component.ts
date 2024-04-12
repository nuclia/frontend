import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SDKService, LabelsService } from '@flaps/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { forkJoin, map, switchMap, take, tap } from 'rxjs';
import { Classification } from '@nuclia/core';

export interface CopilotData {
  agent: string;
  topic: string;
  prompt: string;
  filters: string;
}

@Component({
  templateUrl: './copilot-modal.component.html',
  styleUrls: ['./copilot-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopilotModalComponent implements OnInit {
  form = new FormGroup({
    agent: new FormControl<string>(''),
    topic: new FormControl<string>(''),
    prompt: new FormControl<string>(''),
    filters: new FormControl<string>(''),
  });
  loading = false;

  hasLabelSets = this.labelService.hasResourceLabelSets;
  resourceLabelSets = this.labelService.resourceLabelSets.pipe(
    tap((labelSets) => {
      if (labelSets) {
        const currentFilters = (this.modal.config.data?.filters || '').split('\n');
        this.labelSelection = Object.entries(labelSets).reduce((selection, [id, labelset]) => {
          labelset.labels.forEach((label) => {
            const labelFilter = `/classification.labels/${id}/${label.title}`;
            if (currentFilters.includes(labelFilter)) {
              selection.push({ labelset: id, label: label.title });
            }
          });
          return selection;
        }, [] as Classification[]);
        this.cdr.markForCheck();
      }
    }),
  );
  labelSelection: Classification[] = [];

  constructor(
    public modal: ModalRef<CopilotData>,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private labelService: LabelsService,
  ) {}

  ngOnInit() {
    if (this.modal.config.data) {
      this.form.patchValue(this.modal.config.data);
    }
  }

  generate() {
    const agent = this.form.get('agent')?.value || 'agent';
    const topic = this.form.get('topic')?.value || '';
    this.loading = true;
    this.cdr.markForCheck();
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin([
            kb.generate(`Define a prompt for a ${agent} that will answer questions about ${topic}`).pipe(
              map((res) => {
                const userPrompt = res.answer.replace('Prompt: ', '');
                return (
                  'Answer the following question based on the provided context: ' +
                  '\n[START OF CONTEXT]\n{context}\n[END OF CONTEXT]\nQuestion: ' +
                  userPrompt +
                  ' {question}'
                );
              }),
            ),
            kb.tokens(topic).pipe(map((res) => res.map((token) => `/entities/${token.ner}/${token.text}`))),
          ]),
        ),
      )
      .subscribe(([prompt, filters]) => {
        this.form.patchValue({ prompt, filters: filters.join('\n') });
        this.labelSelection = [];
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  apply() {
    this.modal.close(this.form.getRawValue());
  }

  updateFilters(labels: Classification[]) {
    const labelFilters = labels.map((label) => `/classification.labels/${label.labelset}/${label.label}`).join('\n');
    const currentFilters = this.form.controls.filters.value;
    this.form.controls.filters.patchValue(currentFilters ? `${currentFilters}\n${labelFilters}` : labelFilters);
    this.labelSelection = labels;
  }
}
