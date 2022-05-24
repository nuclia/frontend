import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, concatMap } from 'rxjs/operators';
import { StateService, SDKService } from '@flaps/auth';
import { Sluggable } from '@flaps/common';
import { Account, KnowledgeBox, WritableKnowledgeBox } from '@nuclia/core';

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
    title: ['', [Sluggable()]],
    description: [''],
  });

  validationMessages = {
    title: {
      sluggable: 'stash.kb_name_invalid',
    },
  };
  useAnonymization = false;

  unsubscribeAll = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
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
    this.kbForm.get('title')?.patchValue(this.kb?.title);
    this.kbForm.get('description')?.patchValue(this.kb?.description);
  }

  saveKb(): void {
    if (this.kbForm.invalid) return;
    const data: Partial<KnowledgeBox> = {
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      // anonymization: this.useAnonymization ? 'anonymization' : '',
    };
    (this.kb as WritableKnowledgeBox)
      .modify(data)
      .pipe(concatMap(() => this.sdk.nuclia.db.getKnowledgeBox(this.account!.slug, this.kb!.slug!)))
      .subscribe((kb) => {
        this.stateService.setStash(kb);
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  changeAnonymization(value: boolean): void {
    this.useAnonymization = value;
    this.kbForm.markAsDirty();
  }
}
