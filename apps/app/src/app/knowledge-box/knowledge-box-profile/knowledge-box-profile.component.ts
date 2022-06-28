import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';
import { StateService, SDKService } from '@flaps/auth';
import { Sluggable } from '@flaps/common';
import { Account, KnowledgeBox, WritableKnowledgeBox } from '@nuclia/core';
import { STFUtils } from '@flaps/core';

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
    title: [''],
    description: [''],
  });

  validationMessages = {
    slug: {
      sluggable: 'stash.kb_name_invalid',
    },
  };

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
        this.stateService.setStash(kb);
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
