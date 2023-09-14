import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, combineLatest, filter, of, Subject } from 'rxjs';
import { auditTime, concatMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { LearningConfigurationUserKeys, SDKService, StateService, STFTrackingService, STFUtils } from '@flaps/core';
import { Account, KnowledgeBox, LearningConfiguration, WritableKnowledgeBox } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Sluggable } from '../validators';

@Component({
  templateUrl: './knowledge-box-settings.component.html',
  styleUrls: ['./knowledge-box-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxSettingsComponent implements OnInit, OnDestroy {
  kb: KnowledgeBox | undefined;
  account: Account | undefined;

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
  isAzureOpenAIEnabled = this.tracking.isFeatureEnabled('azure_openai');

  constructor(
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    private translate: TranslateService,
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
    this.stateService.kb
      .pipe(
        filter((data) => !!data),
        tap((data) => (this.kb = data || undefined)),
        switchMap(() => this.stateService.account.pipe(takeUntil(this.unsubscribeAll))),
        tap((data) => (this.account = data || undefined)),
        switchMap(() => (this.kb?.getConfiguration().pipe(catchError(() => of({}))) || of({})).pipe(take(1))),
        tap((conf) => (this.currentConfig = conf)),
        switchMap(() =>
          combineLatest([
            this.isAzureOpenAIEnabled,
            this.sdk
              .getVisibleLearningConfiguration(false)
              .pipe(catchError(() => of({ display: [], full: [], keys: {} }))),
          ]),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([isAzureOpenAIEnabled, { display, full, keys }]) => {
        this.displayedLearningConfigurations = display;
        this.learningConfigurations = full;
        this.userKeys = keys;
        if (!isAzureOpenAIEnabled) {
          if (this.currentConfig['generative_model'] === 'chatgpt-azure') {
            this.currentConfig['generative_model'] = 'chatgpt';
          }
        }
        if (this.kb) {
          this.kbForm = this.formBuilder.group({
            uid: [this.kb?.id],
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
            }),
          });
          this.ownKey = this.hasOwnKey();
          this.formReady.next();
          this.cdr?.markForCheck();
        }
      });
  }

  initKbForm() {
    this.kbForm?.patchValue({
      uid: this.kb?.id,
      slug: this.kb?.slug,
      title: this.kb?.title,
      description: this.kb?.description,
      config: this.currentConfig,
    });
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
      this.cdr?.markForCheck();
    }
  }

  saveKb(): void {
    if (!this.kbForm || this.kbForm.invalid) return;
    this.saving = true;
    const newSlug = STFUtils.generateSlug(this.kbForm.value.slug);
    const data: Partial<KnowledgeBox> = {
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      slug: newSlug,
    };
    const kb = this.kb as WritableKnowledgeBox;
    kb.modify(data)
      .pipe(
        switchMap(() => {
          const current = (this.learningConfigurations || []).reduce(
            (acc, entry) => {
              if (this.currentConfig[entry.id]) {
                acc[entry.id] = this.currentConfig[entry.id];
              }
              return acc;
            },
            {} as { [key: string]: string },
          );
          const conf = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
            acc[entry.id] = this.kbForm?.value.config[entry.id];
            return acc;
          }, current);

          const userKeys = {
            user_keys: (this.displayedLearningConfigurations || []).reduce(
              (acc, entry) => {
                const group = this.getVisibleFieldGroup(entry);
                if (group && this.ownKey) {
                  acc[group] = Object.keys(this.userKeys?.[group] || {}).reduce(
                    (acc, fieldId) => {
                      const value = this.kbForm?.value.config['user_keys'][group][fieldId];
                      acc[fieldId] = value;
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

          return kb.setConfiguration({ ...conf, ...userKeys });
        }),
        concatMap(() =>
          this.sdk.nuclia.db.getKnowledgeBox(this.account!.slug, kb.account === 'local' ? kb.id : newSlug),
        ),
      )
      .subscribe((kb) => {
        this.kbForm?.markAsPristine();
        this.saving = false;
        this.stateService.setKb(kb);
        this.sdk.refreshKbList(true);
      });
  }

  getVisibleFieldGroup(conf: { id: string; data: LearningConfiguration }) {
    const selectedOption = this.kbForm?.value['config'][conf.id] || '';
    const groupId = conf.data.options.find((option) => option.value === selectedOption)?.user_key;
    return groupId && this.userKeys?.[groupId] ? groupId : undefined;
  }

  hasTranslation(key: string) {
    const translation = this.translate.instant(key);
    return translation !== key && translation !== '';
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
