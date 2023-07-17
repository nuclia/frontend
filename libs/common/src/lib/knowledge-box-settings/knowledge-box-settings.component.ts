import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, filter, of, Subject } from 'rxjs';
import { auditTime, concatMap, delay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { LearningConfigurationUserKeys, SDKService, StateService, STFUtils } from '@flaps/core';
import { Account, KnowledgeBox, LearningConfiguration, WritableKnowledgeBox } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
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
  learningConfigurations?: { id: string; data: LearningConfiguration }[];
  displayedLearningConfigurations?: { id: string; data: LearningConfiguration }[];
  userKeys?: LearningConfigurationUserKeys;
  currentConfig: { [key: string]: any } = {};

  constructor(
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.stateService.stash
      .pipe(
        filter((data) => !!data),
        tap((data) => (this.kb = data || undefined)),
        switchMap(() => this.stateService.account.pipe(takeUntil(this.unsubscribeAll))),
        tap((data) => (this.account = data || undefined)),
        switchMap(() => (this.kb?.getConfiguration().pipe(catchError(() => of({}))) || of({})).pipe(take(1))),
        tap((conf) => (this.currentConfig = conf)),
        switchMap(() =>
          this.sdk
            .getVisibleLearningConfiguration(false)
            .pipe(catchError(() => of({ display: [], full: [], keys: {} }))),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ display, full, keys }) => {
        this.displayedLearningConfigurations = display;
        this.learningConfigurations = full;
        this.userKeys = keys;
        if (this.kb) {
          this.kbForm = this.formBuilder.group({
            uid: [this.kb?.id],
            slug: [this.kb?.slug, [Sluggable()]],
            title: [this.kb?.title, [Validators.required]],
            description: [this.kb?.description],
            config: this.formBuilder.group({
              ...(this.displayedLearningConfigurations || []).reduce((acc, entry) => {
                acc[entry.id] = this.currentConfig[entry.id];
                return acc;
              }, {} as { [key: string]: any }),
              user_keys: this.formBuilder.group(
                Object.entries(this.userKeys || {}).reduce((acc, [groupId, group]) => {
                  acc[groupId] = this.formBuilder.group(
                    Object.entries(group).reduce((acc, [fieldId, field]) => {
                      acc[fieldId] = [this.currentConfig['user_keys']?.[groupId]?.[fieldId] || ''];
                      return acc;
                    }, {} as { [key: string]: any }),
                  );
                  return acc;
                }, {} as { [key: string]: any }),
              ),
            }),
          });
          this.updateFormValidators();
          this.kbForm.controls['config'].valueChanges
            .pipe(takeUntil(this.unsubscribeAll), auditTime(100))
            .subscribe(() => {
              this.updateFormValidators();
            });
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
          if (visibleGroups.includes(groupId)) {
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
          const current = (this.learningConfigurations || []).reduce((acc, entry) => {
            if (this.currentConfig[entry.id]) {
              acc[entry.id] = this.currentConfig[entry.id];
            }
            return acc;
          }, {} as { [key: string]: string });
          let hasChange = false;
          const conf = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
            if (current[entry.id] !== this.kbForm?.value.config[entry.id]) {
              hasChange = true;
            }
            acc[entry.id] = this.kbForm?.value.config[entry.id];
            return acc;
          }, current);

          const userKeys = {
            user_keys: (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
              const group = this.getVisibleFieldGroup(entry);
              if (group) {
                acc[group] = Object.keys(this.userKeys?.[group] || {}).reduce((acc, fieldId) => {
                  const value = this.kbForm?.value.config['user_keys'][group][fieldId];
                  if ((this.currentConfig['user_keys']?.[group]?.[fieldId] || '') !== value) {
                    hasChange = true;
                  }
                  acc[fieldId] = value;
                  return acc;
                }, {} as { [key: string]: any });
              }
              return acc;
            }, {} as { [key: string]: any }),
          };

          return hasChange ? kb.setConfiguration({ ...conf, ...userKeys }) : of(null);
        }),
        concatMap(() =>
          this.sdk.nuclia.db.getKnowledgeBox(this.account!.slug, kb.account === 'local' ? kb.id : newSlug),
        ),
      )
      .subscribe((kb) => {
        this.kbForm?.markAsPristine();
        this.saving = false;
        this.stateService.setStash(kb);
        this.sdk.refreshKbList(true);
      });
  }

  getVisibleFieldGroup(conf: { id: string; data: LearningConfiguration }) {
    const selectedOption = this.kbForm?.value['config'][conf.id] || '';
    const groupId = conf.data.options.find((option) => option.value === selectedOption)?.user_key;
    return groupId && this.userKeys?.[groupId] ? groupId : undefined;
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
