import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LearningConfigurationOption } from '@nuclia/core';
import {
  ExpandableTextareaComponent,
  InfoCardComponent,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { filter, of, Subject, take } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { convertEnumProperties, keyProviders } from '../ai-models.utils';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { UserKeysComponent, UserKeysForm } from './user-keys/user-keys.component';
import { ModelSelectorComponent } from './model-selector/model-selector.component';

@Component({
  selector: 'stf-answer-generation',
  imports: [
    CommonModule,
    FormsModule,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    StickyFooterComponent,
    PaButtonModule,
    UserKeysComponent,
    ExpandableTextareaComponent,
    ModelSelectorComponent,
  ],
  templateUrl: './answer-generation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerGenerationComponent extends LearningConfigurationDirective implements OnDestroy {
  keyProviders = keyProviders;

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
    return this.generativeModelValue?.includes('/');
  }

  constructor() {
    super();
    this.configForm.controls.generative_model.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((value) => {
      this.updateCurrentGenerativeModel(value);
      // Wait for the user key form to update before setting their values
      setTimeout(() => {
        this.resetUserKeys();
      });
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
      this.configForm.markAsPristine();
      this.updateCurrentGenerativeModel();
      this.cdr.markForCheck();
    }
  }

  resetUserKeys() {
    const kbConfig = this.kbConfigBackup;
    const userKeyId = this.currentGenerativeModel?.user_key;
    if (kbConfig && userKeyId) {
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
    this.userKeysForm?.markAsPristine();
    this.cdr.markForCheck();
  }

  protected save() {
    if (!this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const { user_prompts, ...kbConfig }: { [key: string]: any } = this.configForm.getRawValue();

    if (this.currentGenerativeModel?.user_key) {
      kbConfig['user_keys'] = {
        [this.currentGenerativeModel.user_key]: this.hasOwnKey ? this.userKeysGroup?.value : null,
      };
    }

    // TODO: remove this block once "PATCH /configuration" endpoint no longer requires passing all the prompts
    kbConfig['user_prompts'] = Object.entries(user_prompts).reduce(
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
    // End of the block to remove

    if (this.currentGenerativeModel?.user_prompt) {
      const userPromptKey = this.currentGenerativeModel.user_prompt;
      const prompts = {
        prompt: user_prompts[userPromptKey].prompt?.trim() || '',
        system: user_prompts[userPromptKey].system?.trim() || '',
      };
      const promptPayload = { [userPromptKey]: prompts.prompt || prompts.system ? prompts : null };
      kbConfig['user_prompts'] = kbConfig['user_prompts']
        ? { ...kbConfig['user_prompts'], ...promptPayload }
        : promptPayload;
    }

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
