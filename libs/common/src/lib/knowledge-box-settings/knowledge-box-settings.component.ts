import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { catchError, filter, of, Subject } from 'rxjs';
import { concatMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SDKService, StateService, STFUtils, VisibleLearningConfiguration } from '@flaps/core';
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
  hasAnswers = false;
  learningConfigurations?: { id: string; data: LearningConfiguration }[];
  displayedLearningConfigurations?: VisibleLearningConfiguration[];
  currentConfig: { [id: string]: string } = {};

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
          this.sdk.getVisibleLearningConfiguration(false).pipe(catchError(() => of({ display: [], full: [] }))),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ display, full }) => {
        this.displayedLearningConfigurations = display;
        this.learningConfigurations = full;
        if (this.kb) {
          this.kbForm = this.formBuilder.group({
            uid: [this.kb?.id],
            slug: [this.kb?.slug, [Sluggable()]],
            title: [this.kb?.title, [Validators.required]],
            description: [this.kb?.description],
            config: this.formBuilder.group(
              this.displayedLearningConfigurations.reduce((acc, entry) => {
                return {
                  ...acc,
                  [entry.id]: [this.currentConfig[entry.id]],
                  ...entry.data.options.reduce((acc, option) => {
                    option.fields.forEach((field) => {
                      acc[field.value] = [this.currentConfig[field.value]];
                    });
                    return acc;
                  }, {} as { [key: string]: any }),
                };
              }, {} as { [key: string]: any }),
            ),
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

  getVisibleFields(conf: VisibleLearningConfiguration) {
    const selectedOption = this.kbForm?.value['config'][conf.id] || '';
    return conf.data.options.find((option) => option.value === selectedOption)?.fields || [];
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
          const fields = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
            this.getVisibleFields(entry).forEach((field) => {
              if (this.currentConfig[field.value] !== this.kbForm?.value.config[field.value]) {
                hasChange = true;
              }
              acc[field.value] = this.kbForm?.value.config[field.value];
            });
            return acc;
          }, {} as { [key: string]: string });

          return hasChange ? kb.setConfiguration({ ...conf, ...fields }) : of(null);
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

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
