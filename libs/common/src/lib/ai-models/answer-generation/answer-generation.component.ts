import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { filter, of, Subject, take } from 'rxjs';
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
export class AnswerGenerationComponent extends LearningConfigurationDirective implements OnDestroy {
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
  modelsRequiringUserKey = ['huggingface'];

  configForm = new FormGroup({
    generative_model: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    user_keys: new FormGroup({}),
    user_prompts: new FormGroup({}),
  });
  currentGenerativeModel?: LearningConfigurationOption;
  userKeyToggle = new FormControl<boolean>(false);
  required = this.translate.instant('kb.ai-models.common.required');
  unsubscribeAll = new Subject<void>();

  get hasOwnKey() {
    return !!this.userKeyToggle.value;
  }
  get generativeModelValue() {
    return this.configForm.controls.generative_model.value;
  }
  get userKeysGroup() {
    return this.configForm.controls.user_keys;
  }
  get userPromptForm() {
    return this.configForm.controls.user_prompts;
  }
  get userPromptSchemas() {
    return this.learningConfigurations?.['user_prompts']?.schemas;
  }

  constructor() {
    super();
    this.userKeyToggle.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.updateValidators();
    });
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
        this.userKeyToggle.disable();
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
      if (this.currentGenerativeModel?.user_key) {
        if (kbConfig['user_keys']) {
          const ownKey = !!kbConfig['user_keys'][this.currentGenerativeModel?.user_key];
          this.userKeyToggle.patchValue(ownKey);
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

    const generativeOption = (this.learningConfigurations['generative_model'].options || []).find(
      (option) => option.value === (modelValue || this.generativeModelValue),
    );
    if (generativeOption) {
      this.currentGenerativeModel = generativeOption;
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
      this.updateValidators();
    }
    this.userKeyToggle.patchValue(this.modelsRequiringUserKey.includes(this.currentGenerativeModel?.value || ''));
  }

  updateValidators() {
    if (!this.learningConfigurations || !this.currentGenerativeModel?.user_key) {
      return;
    }
    const required =
      this.learningConfigurations['user_keys'].schemas?.[this.currentGenerativeModel?.user_key]?.required || [];
    Object.keys(this.userKeysGroup.controls).forEach((key) => {
      this.userKeysGroup.get(key)?.setValidators(this.hasOwnKey && required.includes(key) ? [Validators.required] : []);
      this.userKeysGroup.get(key)?.markAsPristine();
      this.userKeysGroup.get(key)?.updateValueAndValidity();
    });
  }

  setPrompt(key: string, promptType: string, value: string) {
    if (value) {
      const formValue = { [key]: { [promptType]: value, [`${promptType}_examples`]: '' } };
      this.userPromptForm.patchValue(formValue);
      this.cdr.markForCheck();
    }
  }
}
