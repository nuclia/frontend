import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { concatMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SDKService, StateService, STFTrackingService, STFUtils } from '@flaps/core';
import { Account, KnowledgeBox, WritableKnowledgeBox } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { Sluggable } from '@flaps/common';

@Component({
  selector: 'app-knowledge-box-profile',
  templateUrl: './knowledge-box-profile.component.html',
  styleUrls: ['./knowledge-box-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxProfileComponent implements OnInit, OnDestroy {
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
  modelOptions: { value: string; name: string }[] = [];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
  ) {}

  ngOnInit(): void {
    this.stateService.stash
      .pipe(
        takeUntil(this.unsubscribeAll),
        tap((data) => (this.kb = data || undefined)),
        switchMap(() => this.stateService.account.pipe(takeUntil(this.unsubscribeAll))),
        tap((data) => (this.account = data || undefined)),
        switchMap(() =>
          forkJoin([
            this.sdk.nuclia.db.getLearningConfigurations().pipe(take(1)),
            this.tracking.isFeatureEnabled('answers'),
          ]),
        ),
      )
      .subscribe(([config, isAnswersEnabled]) => {
        if (this.kb) {
          if (config.generative_model && isAnswersEnabled) {
            this.hasAnswers = true;
            this.modelOptions = config.generative_model.options;
          }
          this.kbForm = this.formBuilder.group({
            uid: [this.kb?.id],
            slug: [this.kb?.slug, [Sluggable()]],
            title: [this.kb?.title, [Validators.required]],
            description: [this.kb?.description],
            generative_model: this.hasAnswers ? [] : undefined,
          });
          this.cdr?.markForCheck();
        }
      });
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
    (this.kb as WritableKnowledgeBox)
      .modify(data)
      .pipe(concatMap(() => this.sdk.nuclia.db.getKnowledgeBox(this.account!.slug, newSlug)))
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
