import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import { LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { Sluggable } from '../validators';

@Component({
  templateUrl: './knowledge-box-settings.component.html',
  styleUrls: ['./knowledge-box-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxSettingsComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();

  kb?: WritableKnowledgeBox;
  kbForm = new FormGroup({
    uid: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl<string>('', { nonNullable: true, validators: [Sluggable(true)] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    semantic_model: new FormControl<string>(''), // readonly field from KB configuration

    anonymization: new FormControl<boolean>(false, { nonNullable: true }),
    pdf_annotation: new FormControl<boolean>(false, { nonNullable: true }),
  });

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

  currentGenerativeModelPrompt?: string;
  currentGenerativeModelKey?: string;

  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      required: 'validation.required',
    },
  };

  learningConfigurations?: LearningConfigurations;
  kbConfigBackup?: { [key: string]: any };
  showAdvancedSection = false;
  hasOwnKey = false;
  updateGenerativeExpanderHeight = new Subject<string | boolean | undefined>();

  // permissions
  isEnterpriseOrGrowth = this.features.isEnterpriseOrGrowth;
  isAnonymizationEnabled = this.features.kbAnonymization;
  isSummarizationEnabled = this.features.summarization;
  isUserPromptsEnabled = this.features.userPrompts;
  isPdfAnnotationEnabled = this.features.pdfAnnotation;

  // accessors
  get generativeModelValue() {
    return this.configForm.controls.generative_model.value;
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

  saving = false;

  constructor(
    private features: FeaturesService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router,
    private toast: SisToastService,
    private modal: SisModalService,
  ) {}

  ngOnInit(): void {
    this.sdk.currentKb
      .pipe(
        tap((kb) => {
          this.kb = kb;
          this.resetKbForm();
          this.cdr.markForCheck();
        }),
        switchMap((kb) => forkJoin([kb.getConfiguration(), this.sdk.nuclia.db.getLearningConfigurations()])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([kbConfig, learningSchema]) => {
        this.kbConfigBackup = kbConfig;
        this.learningConfigurations = learningSchema;
        this.resetConfigForm();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private resetKbForm() {
    if (this.kb) {
      this.kbForm.patchValue({
        uid: this.kb.id,
        zone: this.kb.zone || '',
        slug: this.kb.slug,
        title: this.kb.title,
        description: this.kb.description || '',
      });
    }
  }
  private resetConfigForm() {
    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.kbForm.patchValue({
        ...kbConfig,
        anonymization: kbConfig['anonymization_model'] === 'multilingual',
        pdf_annotation: kbConfig['visual_labeling'] !== 'disabled',
      });
      this.configForm.patchValue(kbConfig);

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
    }
  }

  resetForms() {
    this.resetKbForm();
    this.resetConfigForm();
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

  saveKb(): void {
    if (this.kbForm.invalid || !this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const kbDetails = this.kbForm.getRawValue();
    const kbConfig: { [key: string]: any } = this.configForm.getRawValue();
    kbConfig['anonymization_model'] = kbDetails.anonymization ? 'multilingual' : 'disabled';
    kbConfig['visual_labeling'] = kbDetails.pdf_annotation ? 'enabled' : 'disabled';
    kbConfig['user_keys'] =
      this.currentGenerativeModelKey && this.hasOwnKey
        ? { [this.currentGenerativeModelKey]: kbConfig['user_keys'] }
        : {};

    const newSlug = STFUtils.generateSlug(kbDetails.slug);
    const oldSlug = kbBackup.slug || '';
    const isSlugUpdated = newSlug !== oldSlug;

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
          kbBackup.modify({
            title: kbDetails.title,
            description: kbDetails.description,
            slug: newSlug,
          }),
        ),
        switchMap(() =>
          kbBackup.setConfiguration(kbConfig).pipe(
            tap(() => this.toast.success(this.translate.instant('kb.settings.toasts.success'))),
            catchError(() => {
              this.toast.error(this.translate.instant('kb.settings.toasts.failure'));
              return of(undefined);
            }),
          ),
        ),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbBackup.id, kbDetails.zone)),
          ),
        ),
      )
      .subscribe(() => {
        this.kbForm.markAsPristine();
        this.configForm.markAsPristine();
        this.saving = false;
        this.sdk.refreshKbList(true);

        if (isSlugUpdated) {
          this.router.navigateByUrl(this.router.url.replace(oldSlug, newSlug));
        }
      });
  }

  toggleKbState() {
    if (!this.kb) {
      return;
    }
    const kb = this.kb;
    const isPublished = kb.state === 'PUBLISHED';
    const label = isPublished ? 'retire' : 'publish';
    const state = isPublished ? 'PRIVATE' : 'PUBLISHED';

    (
      this.modal.openConfirm({
        title: `stash.${label}.title`,
        description: this.translate.instant(`stash.${label}.warning`, { kb: kb.title }),
      }).onClose as Observable<boolean>
    )
      .pipe(
        filter((confirm) => confirm),
        switchMap(() => kb.publish(state === 'PUBLISHED').pipe(tap(() => this.sdk.refreshKbList(true)))),
        take(1),
      )
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: () => this.toast.error(`stash.${label}.error`),
      });
  }

  updateHasOwnKey() {
    this.updateGenerativeExpanderHeight.next(this.hasOwnKey);
    this.kbForm.markAsDirty();
  }
}
