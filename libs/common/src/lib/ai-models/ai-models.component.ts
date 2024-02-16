import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { filter, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { FeaturesService, SDKService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaButtonModule, PaExpanderModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LearningOptionPipe } from '../pipes';

@Component({
  selector: 'stf-ai-models',
  standalone: true,
  imports: [
    CommonModule,
    LearningOptionPipe,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './ai-models.component.html',
  styleUrl: './ai-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiModelsComponent implements OnInit {
  unsubscribeAll = new Subject<void>();
  learningConfigurations?: LearningConfigurations;
  currentGenerativeModelPrompt?: string;
  currentGenerativeModelKey?: string;
  updateGenerativeExpanderHeight = new Subject<string | boolean | undefined>();

  kb?: WritableKnowledgeBox;
  kbConfigBackup?: { [key: string]: any };
  saving = false;
  hasOwnKey = false;

  // control name corresponding to properties from kb configuration
  configForm = new FormGroup({
    anonymization_model: new FormControl<string>(''),
    generative_model: new FormControl<string>(''),
    summary: new FormControl<'simple' | 'extended'>('simple'),
    summary_model: new FormControl<string>(''),
    visual_labeling: new FormControl<string>(''),

    user_keys: new FormGroup({}),
    user_prompts: new FormGroup({
      prompt: new FormControl<string>(''),
      prompt_examples: new FormControl<string>(''),
      system: new FormControl<string>(''),
      system_examples: new FormControl<string>(''),
    }),
    summary_prompt: new FormGroup({
      prompt: new FormControl<string>(''),
      prompt_examples: new FormControl<string>(''),
    }),
  });

  anonymization = new FormControl<boolean>(false, { nonNullable: true });
  pdfAnnotation = new FormControl<boolean>(false, { nonNullable: true });
  semanticModel = new FormControl<string>('false', { nonNullable: true });

  get anonymizationValue() {
    return this.anonymization.value;
  }
  get pdfAnnotationValue() {
    return this.pdfAnnotation.value;
  }
  get userPromptForm() {
    return this.configForm.controls.user_prompts;
  }
  get summaryPromptForm() {
    return this.configForm.controls.summary_prompt;
  }
  get userKeysGroup() {
    return this.configForm.controls.user_keys;
  }
  get generativeModelValue() {
    return this.configForm.controls.generative_model.value;
  }

  // permissions
  isEnterpriseOrGrowth = this.features.isEnterpriseOrGrowth;
  isAnonymizationEnabled = this.features.kbAnonymization;
  isSummarizationEnabled = this.features.summarization;
  isUserPromptsEnabled = this.features.userPrompts;
  isPdfAnnotationEnabled = this.features.pdfAnnotation;

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        tap((kb) => (this.kb = kb)),
        switchMap((kb) => forkJoin([kb.getConfiguration(), this.sdk.nuclia.db.getLearningConfigurations()])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([kbConfig, learningSchema]) => {
        this.kbConfigBackup = kbConfig;
        this.learningConfigurations = learningSchema;
        this.resetForm();
      });
  }

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private modal: SisModalService,
    private toast: SisToastService,
    private features: FeaturesService,
    private translate: TranslateService,
  ) {}

  updateKbFormTouchedState() {
    if (!this.kbConfigBackup) {
      return;
    }
    if (
      this.anonymizationValue !== (this.kbConfigBackup['anonymization_model'] === 'multilingual') ||
      this.pdfAnnotationValue !== (this.kbConfigBackup['visual_labeling'] !== 'disabled')
    ) {
      this.configForm.markAsDirty();
    }
    // FIXME
  }

  updateCurrentGenerativeModel(modelValue?: string) {
    if (!this.learningConfigurations || (!this.generativeModelValue && !modelValue)) {
      return;
    }
    // remove all fields from the user_keys group
    Object.keys(this.userKeysGroup.controls).forEach((oldKey) => {
      this.userKeysGroup.removeControl(oldKey);
    });
    const generativeOption = (this.learningConfigurations['generative_model'].options || []).find(
      (option) => option.value === (modelValue || this.generativeModelValue),
    );
    if (generativeOption) {
      this.currentGenerativeModelPrompt = generativeOption.user_prompt;
      this.currentGenerativeModelKey = generativeOption.user_key;

      if (this.currentGenerativeModelKey) {
        // add user_keys controls corresponding to generative model if any
        Object.keys(
          this.learningConfigurations['user_keys'].schemas?.[this.currentGenerativeModelKey]?.properties || {},
        ).forEach((key) => {
          this.userKeysGroup.addControl(key, new FormControl<string>(''));
        });
      }
    }
    this.updateGenerativeExpanderHeight.next(this.currentGenerativeModelPrompt);
  }

  setPrompt(group: 'user' | 'summary', field: string, value: string) {
    if (value) {
      const formValue = { [field]: value, [`${field}_examples`]: '' };
      switch (group) {
        case 'summary':
          this.summaryPromptForm.patchValue(formValue);
          break;
        case 'user':
          this.userPromptForm.patchValue(formValue);
          break;
      }
      this.cdr.markForCheck();
    }
  }

  save() {
    if (!this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const kbDetails = {
      anonymization: this.anonymizationValue,
      pdf_annotation: this.pdfAnnotationValue,
    };
    const kbConfig: { [key: string]: any } = this.configForm.getRawValue();
    kbConfig['anonymization_model'] = kbDetails.anonymization ? 'multilingual' : 'disabled';
    kbConfig['visual_labeling'] = kbDetails.pdf_annotation ? 'enabled' : 'disabled';
    kbConfig['user_keys'] =
      this.currentGenerativeModelKey && this.hasOwnKey
        ? { [this.currentGenerativeModelKey]: kbConfig['user_keys'] }
        : {};
    kbConfig['user_prompts'] = this.currentGenerativeModelPrompt
      ? { [this.currentGenerativeModelPrompt]: kbConfig['user_prompts'] }
      : {};

    const confirmAnonymization: Observable<boolean> =
      kbDetails.anonymization && this.kbConfigBackup?.['anonymization_model'] === 'disabled'
        ? this.modal.openConfirm({
            title: this.translate.instant('kb.settings.confirm-anonymization.title'),
            description: this.translate.instant('kb.settings.confirm-anonymization.description'),
            confirmLabel: this.translate.instant('kb.settings.confirm-anonymization.confirm-button'),
          }).onClose
        : of(true);

    confirmAnonymization
      .pipe(
        filter((confirm) => confirm),
        switchMap(() =>
          this.isSummarizationEnabled.pipe(
            take(1),
            tap((isSummarizationEnabled) => {
              if (!isSummarizationEnabled) {
                delete kbConfig['summary'];
                delete kbConfig['summary_model'];
                delete kbConfig['summary_prompt'];
              }
            }),
          ),
        ),
        switchMap(() =>
          kbBackup.setConfiguration(kbConfig).pipe(
            tap(() => this.toast.success(this.translate.instant('kb.ai-models.toasts.success'))),
            catchError(() => {
              this.toast.error(this.translate.instant('kb.ai-models.toasts.failure'));
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

  updateHasOwnKey() {
    this.updateGenerativeExpanderHeight.next(this.hasOwnKey);
  }

  resetForm() {
    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.configForm.patchValue(kbConfig);
      this.semanticModel.patchValue(kbConfig['semantic_model']);
      this.anonymization.patchValue(kbConfig['anonymization_model'] === 'multilingual');
      this.pdfAnnotation.patchValue(kbConfig['visual_labeling'] === 'multilingual');

      this.updateCurrentGenerativeModel();
      if (this.currentGenerativeModelPrompt) {
        if (kbConfig['user_prompts']) {
          this.userPromptForm.patchValue(kbConfig['user_prompts'][this.currentGenerativeModelPrompt]);
        }
      }
      if (this.currentGenerativeModelKey) {
        if (kbConfig['user_keys']) {
          this.hasOwnKey = !!kbConfig['user_keys'][this.currentGenerativeModelKey];
          this.userKeysGroup.patchValue(kbConfig['user_keys'][this.currentGenerativeModelKey]);
        }
      }
      this.summaryPromptForm.patchValue(kbConfig['summary_prompt']);
      setTimeout(() => {
        this.configForm.markAsPristine();
        this.cdr.markForCheck();
      });
    }
  }
}
