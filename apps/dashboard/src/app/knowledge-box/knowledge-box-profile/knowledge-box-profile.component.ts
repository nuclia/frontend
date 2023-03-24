import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { concatMap, takeUntil } from 'rxjs/operators';
import { SDKService, StateService, STFUtils } from '@flaps/core';
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

  kbForm = this.formBuilder.group({
    uid: [''],
    slug: ['', [Sluggable()]],
    title: ['', [Validators.required]],
    description: [''],
  });

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

  constructor(
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.stateService.stash.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      this.kb = data || undefined;
      if (this.kb) {
        this.initKbForm();
        this.cdr?.markForCheck();
      }
    });
    this.stateService.account.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      this.account = data || undefined;
      this.cdr?.markForCheck();
    });
  }

  initKbForm(): void {
    this.kbForm.get('uid')?.patchValue(this.kb?.id);
    this.kbForm.get('slug')?.patchValue(this.kb?.slug);
    this.kbForm.get('title')?.patchValue(this.kb?.title);
    this.kbForm.get('description')?.patchValue(this.kb?.description);
  }

  saveKb(): void {
    if (this.kbForm.invalid) return;
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
        this.kbForm.markAsPristine();
        this.saving = false;
        this.stateService.setStash(kb);
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
