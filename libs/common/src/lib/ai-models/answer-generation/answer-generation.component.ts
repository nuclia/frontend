import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { filter, of, take } from 'rxjs';
import { UnauthorizedFeatureDirective } from '@flaps/core';
import { LearningConfigurationOption } from '@nuclia/core';

@Component({
  selector: 'stf-answer-generation',
  standalone: true,
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
    UnauthorizedFeatureDirective,
  ],
  templateUrl: './answer-generation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerGenerationComponent extends LearningConfigurationDirective {
  keyProviders: { [key: string]: string } = {
    azure_openai: 'Azure OpenAI',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    claude3: 'Anthropic',
    palm: 'Google',
    mistral: 'Mistral',
    azure_mistral: 'Azure Mistral',
    'chatgpt-vision': 'ChatGPT Vision',
    chatgpt4: 'ChatGPT 4',
    hf_llm: 'Hugging Face',
  };
  popoverHelp: { [key: string]: string } = {
    'chatgpt-vision': 'kb.ai-models.answer-generation.select-llm.help.chatgpt-vision',
  };

  configForm = new FormGroup({
    generative_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    user_keys: new FormGroup({}),
    user_prompts: new FormGroup({
      prompt: new FormControl<string>(''),
      prompt_examples: new FormControl<string>(''),
      system: new FormControl<string>(''),
      system_examples: new FormControl<string>(''),
    }),
  });
  currentGenerativeModel?: LearningConfigurationOption;
  hasOwnKey = false;

  get generativeModelValue() {
    return this.configForm.controls.generative_model.value;
  }
  get userKeysGroup() {
    return this.configForm.controls.user_keys;
  }
  get userPromptForm() {
    return this.configForm.controls.user_prompts;
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
        this.userKeysGroup.disable();
        this.userPromptForm.disable();
      });

    if (kbConfig) {
      this.configForm.patchValue(kbConfig);

      this.updateCurrentGenerativeModel();
      if (this.currentGenerativeModel?.user_prompt) {
        if (kbConfig['user_prompts']) {
          this.userPromptForm.patchValue(kbConfig['user_prompts'][this.currentGenerativeModel?.user_prompt]);
        }
      }
      if (this.currentGenerativeModel?.user_key) {
        if (kbConfig['user_keys']) {
          const ownKey = !!kbConfig['user_keys'][this.currentGenerativeModel?.user_key];
          this.hasOwnKey = ownKey;
          this.userKeysGroup.patchValue(kbConfig['user_keys'][this.currentGenerativeModel?.user_key]);
        }
      }

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
    kbConfig['user_keys'] =
      this.currentGenerativeModel?.user_key && this.hasOwnKey
        ? { [this.currentGenerativeModel?.user_key]: kbConfig['user_keys'] }
        : {};
    kbConfig['user_prompts'] = this.currentGenerativeModel?.user_prompt
      ? {
          [this.currentGenerativeModel?.user_prompt]: {
            ...kbConfig['user_prompts'],
            prompt: kbConfig['user_prompts'].prompt?.trim(),
            system: kbConfig['user_prompts'].system?.trim(),
          },
        }
      : {};

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

    const generativeOption = (this.learningConfigurations['generative_model'].options || []).find(
      (option) => option.value === (modelValue || this.generativeModelValue),
    );
    if (generativeOption) {
      this.currentGenerativeModel = generativeOption;
      this.userPromptForm.patchValue({
        prompt: '',
        system: '',
      });
    }
    if (this.currentGenerativeModel?.user_key) {
      // add user_keys controls corresponding to generative model if any
      const newUserKeys = Object.keys(
        this.learningConfigurations['user_keys'].schemas?.[this.currentGenerativeModel?.user_key]?.properties || {},
      );
      Object.keys(this.userKeysGroup.controls).forEach((oldKey) => {
        if (newUserKeys.includes(oldKey)) {
          // clean up value from previous fields
          this.userKeysGroup.get(oldKey)?.patchValue('');
        } else {
          // remove unused control
          this.userKeysGroup.removeControl(oldKey);
        }
      });
      newUserKeys.forEach((key) => {
        if (!this.userKeysGroup.get(key)) {
          this.userKeysGroup.addControl(key, new FormControl<string>(''));
        }
      });
    }
  }

  setPrompt(field: string, value: string) {
    if (value) {
      const formValue = { [field]: value, [`${field}_examples`]: '' };
      this.userPromptForm.patchValue(formValue);
      this.cdr.markForCheck();
    }
  }
}
