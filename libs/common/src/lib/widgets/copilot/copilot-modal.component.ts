import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { forkJoin, map, switchMap, take } from 'rxjs';

@Component({
  templateUrl: './copilot-modal.component.html',
  styleUrls: ['./copilot-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopilotModalComponent {
  form: FormGroup = new FormGroup({
    agent: new FormControl<string>(''),
    topic: new FormControl<string>(''),
    prompt: new FormControl<string>(''),
    filters: new FormControl<string>(''),
  });
  loading = false;

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

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
        this.loading = false;
        this.cdr.markForCheck();
      });
  }

  apply() {
    this.modal.close({
      prompt: this.form.get('prompt')?.value || '',
      filters: this.form.get('filters')?.value || '',
    });
  }
}
