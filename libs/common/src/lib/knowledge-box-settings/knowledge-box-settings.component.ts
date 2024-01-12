import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, combineLatest, filter, Observable, of, Subject } from 'rxjs';
import { auditTime, concatMap, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import {
  Account,
  KnowledgeBox,
  LearningConfiguration,
  LearningConfigurationSchema,
  LearningConfigurationSet,
  LearningConfigurationUserKeys,
  SUMMARY_PROMPT,
  USER_PROMPTS,
  WritableKnowledgeBox,
} from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Sluggable } from '../validators';
import { Router } from '@angular/router';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { KnowledgeBoxSettingsService } from './knowledge-box-settings.service';

const EMPTY_CONFIG = {
  display: [] as LearningConfigurationSet,
  full: [] as LearningConfigurationSet,
  keys: {} as LearningConfigurationUserKeys,
};

@Component({
  templateUrl: './knowledge-box-settings.component.html',
  styleUrls: ['./knowledge-box-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxSettingsComponent implements OnInit, OnDestroy {
  kb: WritableKnowledgeBox | undefined;
  account: Account | undefined;

  currentKb$ = this.sdk.currentKb.pipe(tap((kb) => (this.kb = kb)));

  kbForm?: UntypedFormGroup;

  validationMessages: { [key: string]: IErrorMessages } = {
    slug: {
      sluggable: 'stash.kb_slug_invalid',
    } as IErrorMessages,
    title: {
      required: 'validation.required',
    },
  };

  saving = false;
  unsubscribeAll = new Subject<void>();
  formReady = new Subject<void>();
  learningConfigurations?: { id: string; data: LearningConfiguration }[];
  displayedLearningConfigurations?: { id: string; data: LearningConfiguration }[];
  userKeys?: LearningConfigurationUserKeys;
  currentConfig: { [key: string]: any } = {};
  ownKey = false;
  userPromptConfigurations?: LearningConfiguration;
  userPromptKeys: string[] = [];
  currentUserPromptConfig?: LearningConfigurationSchema;
  currentUserPromptKey?: string;

  isUserPromptsEnabled = this.features.userPrompts;
  isSummarizationEnabled = this.features.summarization;

  summaryPromptConfigurations?: LearningConfiguration;

  constructor(
    private settingService: KnowledgeBoxSettingsService,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router,
    private features: FeaturesService,
    private toast: SisToastService,
    private modal: SisModalService,
  ) {}

  ngOnInit(): void {
    this.formReady
      .pipe(
        tap(() => this.updateFormValidators()),
        switchMap(() => this.kbForm?.controls['config'].valueChanges || of({})),
        auditTime(100),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.updateFormValidators());

    let initRequest: Observable<{
      display: LearningConfigurationSet;
      full: LearningConfigurationSet;
      keys: LearningConfigurationUserKeys;
    }>;

    if (this.sdk.nuclia.options.standalone) {
      initRequest = this.currentKb$.pipe(switchMap(() => of(EMPTY_CONFIG)));
    } else {
      initRequest = combineLatest([
        this.sdk.currentAccount.pipe(tap((account) => (this.account = account))),
        this.currentKb$,
      ]).pipe(
        switchMap(([, kb]) => kb.getConfiguration().pipe(take(1))),
        tap((conf) => (this.currentConfig = conf)),
        switchMap(() =>
          this.settingService.getVisibleLearningConfiguration(false).pipe(catchError(() => of(EMPTY_CONFIG))),
        ),
        takeUntil(this.unsubscribeAll),
      );
    }
    initRequest.subscribe(({ display, full, keys }) => {
      this.displayedLearningConfigurations = display.filter(
        (entry) => entry.id !== USER_PROMPTS && entry.id !== SUMMARY_PROMPT,
      );
      this.userPromptConfigurations = display.find((entry) => entry.id === USER_PROMPTS)?.data;
      this.summaryPromptConfigurations = display.find((entry) => entry.id === SUMMARY_PROMPT)?.data;
      this.userPromptKeys = Object.keys(this.userPromptConfigurations?.schemas || {});
      const userPromptsValues = Object.entries(this.userPromptConfigurations?.schemas || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = {};
          if (value.properties['prompt']) {
            acc[key]['prompt'] = this.currentConfig['user_prompts']?.[key]?.prompt || '';
          }
          if (value.properties['system']) {
            acc[key]['system'] = this.currentConfig['user_prompts']?.[key]?.system || '';
          }
          return acc;
        },
        {} as { [key: string]: { prompt?: string; system?: string } },
      );
      this.learningConfigurations = full;
      this.userKeys = keys;

      if (this.kb) {
        this.kbForm = this.getKbForm(userPromptsValues);
        this.updateUserPrompts(this.currentConfig['generative_model'] || '');
        this.ownKey = this.hasOwnKey();
        this.formReady.next();
      }
      this.cdr.markForCheck();
    });
  }

  private getKbForm(userPromptsValues: { [p: string]: { prompt?: string; system?: string } }) {
    return this.formBuilder.group({
      uid: [this.kb?.id],
      zone: [this.kb?.zone],
      slug: [this.kb?.slug, [Sluggable()]],
      title: [this.kb?.title, [Validators.required]],
      description: [this.kb?.description],
      config: this.formBuilder.group({
        ...(this.displayedLearningConfigurations || []).reduce(
          (acc, entry) => {
            acc[entry.id] = this.currentConfig[entry.id];
            return acc;
          },
          {} as { [key: string]: any },
        ),
        user_keys: this.formBuilder.group(
          Object.entries(this.userKeys || {}).reduce(
            (acc, [groupId, group]) => {
              acc[groupId] = this.formBuilder.group(
                Object.entries(group).reduce(
                  (acc, [fieldId, field]) => {
                    acc[fieldId] = [this.currentConfig['user_keys']?.[groupId]?.[fieldId] || ''];
                    return acc;
                  },
                  {} as { [key: string]: any },
                ),
              );
              return acc;
            },
            {} as { [key: string]: any },
          ),
        ),
        user_prompts: this.formBuilder.group(
          Object.entries(userPromptsValues || {}).reduce(
            (acc, [key, value]) => {
              acc[key] = this.formBuilder.group(
                Object.entries(value).reduce(
                  (acc, [fieldId, field]) => {
                    acc[fieldId] = [field || ''];
                    acc[`${fieldId}_examples`] = [''];
                    return acc;
                  },
                  {} as { [key: string]: string[] },
                ),
              );
              return acc;
            },
            {} as { [key: string]: UntypedFormGroup },
          ),
        ),
        summary_prompt: this.formBuilder.group({
          prompt: [''],
          prompt_examples: [''],
        }),
      }),
    });
  }

  initKbForm() {
    if (!this.kbForm || !this.kb) {
      return;
    }
    this.kbForm.patchValue({
      uid: this.kb.id,
      slug: this.kb.slug,
      title: this.kb.title,
      description: this.kb.description,
      config: this.currentConfig,
      zone: this.kb.zone,
    });
    this.updateUserPrompts(this.currentConfig['generative_model'] || '');
    this.kbForm.markAsPristine();
  }

  hasOwnKey() {
    const generativeModel = (this.displayedLearningConfigurations || []).find((conf) => conf.id === 'generative_model');
    const selectedGroup = generativeModel && this.getVisibleFieldGroup(generativeModel);
    const currentGroupConfig = selectedGroup && this.currentConfig['user_keys']?.[selectedGroup];
    return (
      Object.values(currentGroupConfig || {}).length > 0 &&
      Object.values(currentGroupConfig || {}).every((value) => !!value)
    );
  }

  toggleOwnKey() {
    this.ownKey = !this.ownKey;
    this.kbForm?.markAsDirty();
    this.updateFormValidators();
    this.cdr.markForCheck();
  }

  updateFormValidators() {
    if (this.kbForm) {
      const userKeysControls = (
        (this.kbForm?.controls['config'] as UntypedFormGroup).controls['user_keys'] as UntypedFormGroup
      ).controls;
      const visibleGroups = (this.displayedLearningConfigurations || [])
        .map((conf) => this.getVisibleFieldGroup(conf))
        .filter((value) => !!value);
      Object.entries(this.userKeys || {}).forEach(([groupId, group]) => {
        Object.entries((userKeysControls[groupId] as UntypedFormGroup).controls).forEach(([fieldId, fieldControl]) => {
          if (visibleGroups.includes(groupId) && this.ownKey) {
            fieldControl.setValidators(group[fieldId].required ? Validators.required : []);
          } else {
            fieldControl.clearValidators();
          }
          fieldControl.updateValueAndValidity({ emitEvent: false });
        });
      });
      this.cdr.markForCheck();
    }
  }

  saveKb(): void {
    if (!this.kbForm || this.kbForm.invalid || !this.kb || !this.account) {
      return;
    }

    this.saving = true;
    const accountId = this.account.id;
    const formValue = this.kbForm.getRawValue();
    const newSlug = STFUtils.generateSlug(formValue.slug);
    const oldSlug = this.kb.slug || '';
    const isSlugUpdated = newSlug !== oldSlug;
    const data: Partial<KnowledgeBox> = {
      title: formValue.title,
      description: formValue.description,
      slug: newSlug,
    };
    const zone = formValue.zone;
    const kb = this.kb as WritableKnowledgeBox;
    kb.modify(data)
      .pipe(
        switchMap(() => {
          const current = this.getCurrentLearningConf();
          const newConfiguration = this.getNewConfiguration(current);

          if (
            current['anonymization_model'] === 'disabled' &&
            newConfiguration['anonymization_model'] === 'multilingual'
          ) {
            return this.modal
              .openConfirm({
                title: this.translate.instant('stash.config.confirm-anonymization.title'),
                description: this.translate.instant('stash.config.confirm-anonymization.description'),
                confirmLabel: this.translate.instant('stash.config.confirm-anonymization.confirm-button'),
              })
              .onClose.pipe(
                switchMap((confirm) => {
                  return confirm
                    ? kb.setConfiguration(newConfiguration).pipe(
                        tap(() => this.toast.success(this.translate.instant('stash.config.success'))),
                        catchError(() => {
                          this.toast.error(this.translate.instant('stash.config.failure'));
                          return of(undefined);
                        }),
                      )
                    : of(true).pipe(map(() => {}));
                }),
              );
          } else {
            return kb.setConfiguration(newConfiguration).pipe(
              tap(() => this.toast.success(this.translate.instant('stash.config.success'))),
              catchError(() => {
                this.toast.error(this.translate.instant('stash.config.failure'));
                return of(undefined);
              }),
            );
          }
        }),
        concatMap(() => this.sdk.nuclia.db.getKnowledgeBox(accountId, kb.id, zone)),
      )
      .subscribe(() => {
        this.kbForm?.markAsPristine();
        this.saving = false;
        this.sdk.refreshKbList(true);

        if (isSlugUpdated) {
          this.router.navigateByUrl(this.router.url.replace(oldSlug, newSlug));
        }
      });
  }

  private getNewConfiguration(current: { [p: string]: any }): { [id: string]: any } {
    const configFormValue = this.kbForm?.value.config;
    const newConf = (this.displayedLearningConfigurations || []).reduce(
      (acc, entry) => {
        acc[entry.id] = configFormValue?.[entry.id];
        return acc;
      },
      { ...current },
    );

    const userKeys = {
      user_keys: (this.displayedLearningConfigurations || []).reduce(
        (acc, entry) => {
          const group = this.getVisibleFieldGroup(entry);
          if (group && this.ownKey) {
            acc[group] = Object.keys(this.userKeys?.[group] || {}).reduce(
              (acc, fieldId) => {
                acc[fieldId] = configFormValue?.['user_keys'][group][fieldId];
                return acc;
              },
              {} as { [key: string]: any },
            );
          }
          return acc;
        },
        {} as { [key: string]: any },
      ),
    };

    const userPromptKey = this.getUserPromptKeyForModel(configFormValue?.['generative_model'] || '');
    if (userPromptKey) {
      if (!newConf['user_prompts']) {
        newConf['user_prompts'] = {};
      }
      newConf['user_prompts'][userPromptKey] = configFormValue?.['user_prompts'][userPromptKey];
    }
    const summaryPrompt = configFormValue?.['summary_prompt'];
    if (summaryPrompt) {
      newConf['summary_prompt'] = summaryPrompt;
    }

    return { ...newConf, ...userKeys };
  }

  private getCurrentLearningConf() {
    return (this.learningConfigurations || []).reduce(
      (acc, entry) => {
        if (this.currentConfig[entry.id]) {
          acc[entry.id] = this.currentConfig[entry.id];
        }
        return acc;
      },
      {} as { [key: string]: any },
    );
  }

  getVisibleFieldGroup(conf: { id: string; data: LearningConfiguration }): string | undefined {
    const selectedOption = this.kbForm?.value['config'][conf.id] || '';
    const groupId = conf.data.options?.find((option) => option.value === selectedOption)?.user_key;
    return groupId && this.userKeys?.[groupId] ? groupId : undefined;
  }

  hasTranslation(key: string) {
    const translation = this.translate.instant(key);
    return translation !== key && translation !== '';
  }

  private getUserPromptKeyForModel(model: string): string | undefined {
    if (this.userPromptConfigurations) {
      const modelsConfig = this.displayedLearningConfigurations?.find((conf) => conf.id === 'generative_model');
      if (modelsConfig) {
        const selectedModel = modelsConfig.data.options?.find((option) => option.value === model);
        if (selectedModel) {
          return selectedModel.user_prompt;
        }
      }
    }
    return undefined;
  }

  updateUserPrompts(model: string) {
    this.currentUserPromptKey = this.getUserPromptKeyForModel(model);
    if (this.userPromptConfigurations && this.currentUserPromptKey && this.kbForm) {
      this.currentUserPromptConfig = this.userPromptConfigurations.schemas?.[this.currentUserPromptKey];
    }
    this.cdr.markForCheck();
  }

  setUserPrompt(field: string, key: string, value: string) {
    if (this.kbForm && value) {
      this.kbForm.controls['config'].patchValue({
        user_prompts: { [key]: { [field]: value, [`${field}_examples`]: '' } },
      });
      this.cdr.markForCheck();
    }
  }

  setSummaryPrompt(value: string) {
    if (this.kbForm && value) {
      this.kbForm.controls['config'].patchValue({
        summary_prompt: { prompt: value, prompt_examples: '' },
      });
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  toggleKbState() {
    if (!this.kb) {
      return;
    }
    const kb = this.kb;
    const isPublished = kb.state === 'PUBLISHED';
    const label = isPublished ? 'retire' : 'publish';
    const state = isPublished ? 'PRIVATE' : 'PUBLISHED';
    this.modal
      .openConfirm({
        title: `stash.${label}.title`,
        description: this.translate.instant(`stash.${label}.warning`, { kb: kb.title }),
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => kb.publish(state === 'PUBLISHED').pipe(tap(() => this.sdk.refreshKbList(true)))),
        take(1),
      )
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: () => this.toast.error(`stash.${label}.error`),
      });
  }
}
