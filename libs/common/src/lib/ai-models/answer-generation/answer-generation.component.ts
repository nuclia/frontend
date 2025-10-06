import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LearningConfigurationOption } from '@nuclia/core';
import {
  ExpandableTextareaComponent,
  InfoCardComponent,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { filter, of, Subject, take } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { convertEnumProperties, keyProviders } from '../ai-models.utils';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { UserKeysComponent, UserKeysForm } from './user-keys/user-keys.component';

@Component({
  selector: 'stf-answer-generation',
  imports: [
    CommonModule,
    FormsModule,
    InfoCardComponent,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    StickyFooterComponent,
    PaButtonModule,
    PaButtonModule,
    UserKeysComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './answer-generation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerGenerationComponent extends LearningConfigurationDirective implements OnDestroy {
  keyProviders = keyProviders;
  popoverHelp: { [key: string]: string } = {
    'chatgpt-vision': 'kb.ai-models.answer-generation.select-llm.help.chatgpt-vision',
  };

  configForm = new FormGroup({
    generative_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    user_prompts: new FormGroup({}),
  });
  userKeysForm?: UserKeysForm;
  currentGenerativeModel?: LearningConfigurationOption;
  unsubscribeAll = new Subject<void>();

  get generativeModelValue() {
    return this.configForm.controls.generative_model.value;
  }
  get userKeysGroup() {
    return this.userKeysForm?.controls?.user_keys;
  }
  get userKeyToggle() {
    return this.userKeysForm?.controls?.enabled;
  }
  get hasOwnKey() {
    return !!this.userKeyToggle?.value;
  }
  get userPromptForm() {
    return this.configForm.controls.user_prompts;
  }
  get userPromptSchemas() {
    return this.learningConfigurations?.['user_prompts']?.schemas;
  }
  get invalid() {
    return this.configForm.invalid || this.userKeysForm?.invalid;
  }
  get pristine() {
    return this.configForm.pristine && this.userKeysForm?.pristine;
  }
  get isModelConfiguration() {
    return this.generativeModelValue.includes('/');
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onOwnKeyToggle() {
    this.configForm.markAsDirty();
  }

  protected resetForm(): void {
    const kbConfig = this.kbConfigBackup;
    this.isSummarizationAuthorized
      .pipe(
        take(1),
        filter((authorized) => !authorized),
      )
      .subscribe(() => {
        this.userKeysForm?.disable();
        this.userPromptForm.disable();
      });

    if (this.learningConfigurations && Object.keys(this.userPromptForm.controls).length === 0) {
      Object.keys(this.userPromptSchemas || {}).forEach((key) => {
        this.userPromptForm.addControl(
          key,
          new FormGroup({
            prompt: new FormControl<string>(''),
            prompt_examples: new FormControl<string>(''),
            system: new FormControl<string>(''),
            system_examples: new FormControl<string>(''),
          }),
        );
      });
    }

    if (kbConfig) {
      this.configForm.patchValue(kbConfig);
      this.updateCurrentGenerativeModel();
      // Wait for the user key form to update before setting their values
      setTimeout(() => {
        const userKeyId = this.currentGenerativeModel?.user_key;
        if (userKeyId) {
          if (kbConfig['user_keys']) {
            const ownKey = !!kbConfig['user_keys'][userKeyId];
            let userKeys = kbConfig['user_keys'][userKeyId];
            const schema = this.learningConfigurations?.['user_keys'].schemas?.[userKeyId];
            if (userKeys && schema) {
              userKeys = convertEnumProperties(userKeys, schema);
            }
            this.userKeyToggle?.patchValue(ownKey);
            this.userKeysGroup?.patchValue(userKeys);
          }
        }
        this.configForm.markAsPristine();
        this.userKeysForm?.markAsPristine();
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
    kbConfig['user_keys'] =
      this.currentGenerativeModel?.user_key && this.hasOwnKey
        ? { [this.currentGenerativeModel?.user_key]: this.userKeysGroup?.value }
        : {};

    kbConfig['user_prompts'] = Object.entries(kbConfig['user_prompts']).reduce(
      (acc, curr: [string, any]) => {
        const prompts = {
          prompt: curr[1].prompt?.trim(),
          system: curr[1].system?.trim(),
        };
        acc[curr[0]] = prompts.prompt || prompts.system ? prompts : undefined;
        return acc;
      },
      {} as { [key: string]: any },
    );

    this.kb
      .setConfiguration(kbConfig)
      .pipe(
        tap(() => this.toaster.success(this.translate.instant('kb.ai-models.toasts.success'))),
        catchError(() => {
          this.toaster.error(this.translate.instant('kb.ai-models.toasts.failure'));
          return of(undefined);
        }),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbBackup.id, kbBackup.zone)),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.configForm.markAsPristine();
          this.saving = false;
          this.sdk.refreshKbList(true);
        },
      });
  }

  updateCurrentGenerativeModel(modelValue?: string) {
    if (!this.learningConfigurations || (!this.generativeModelValue && !modelValue)) {
      return;
    }

    this.currentGenerativeModel = (this.learningConfigurations['generative_model'].options || []).find(
      (option) => option.value === (modelValue || this.generativeModelValue),
    );
  }

  setPrompt(key: string, promptType: string, value: string) {
    if (value) {
      const formValue = { [key]: { [promptType]: value, [`${promptType}_examples`]: '' } };
      this.userPromptForm.patchValue(formValue);
      this.cdr.markForCheck();
    }
  }
}
