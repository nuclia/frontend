import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InfoCardComponent, StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { LearningOptionPipe } from '../../pipes';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import { filter, of } from 'rxjs';

@Component({
  selector: 'stf-summarization',
  standalone: true,
  imports: [
    CommonModule,
    LearningOptionPipe,
    PaTogglesModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    InfoCardComponent,
    TranslateModule,
    PaTextFieldModule,
    PaTextFieldModule,
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './summarization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizationComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    summary: new FormControl<'simple' | 'extended'>('simple'),
    summary_model: new FormControl<string>(''),
    summary_prompt: new FormGroup({
      prompt: new FormControl<string>(''),
      prompt_examples: new FormControl<string>(''),
    }),
  });
  @Input() unsupportedModels: string[] = [];

  get summaryPromptForm() {
    return this.configForm.controls.summary_prompt;
  }

  protected resetForm(): void {
    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.configForm.patchValue(kbConfig);
      this.summaryPromptForm.patchValue(kbConfig['summary_prompt']);
      setTimeout(() => {
        this.configForm.markAsPristine();
        this.cdr.markForCheck();
      });
    }
  }

  protected save() {
    if (!this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const kbConfig: { [key: string]: any } = this.configForm.getRawValue();
    this.isSummarizationEnabled
      .pipe(
        take(1),
        filter((summarization) => !!summarization),
        switchMap(() =>
          kbBackup.setConfiguration(kbConfig).pipe(
            tap(() => this.toaster.success(this.translate.instant('kb.ai-models.toasts.success'))),
            catchError(() => {
              this.toaster.error(this.translate.instant('kb.ai-models.toasts.failure'));
              return of(undefined);
            }),
          ),
        ),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbBackup.id, kbBackup.zone)),
          ),
        ),
      )
      .subscribe(() => {
        this.configForm.markAsPristine();
        this.saving = false;
        this.sdk.refreshKbList(true);
      });
  }

  setPrompt(field: string, value: string) {
    if (value) {
      const formValue = { [field]: value, [`${field}_examples`]: '' };
      this.summaryPromptForm.patchValue(formValue);
      this.cdr.markForCheck();
    }
  }
}
