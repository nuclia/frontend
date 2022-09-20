import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService, STFUtils, Zone } from '@flaps/core';
import { Sluggable } from '@flaps/common';
import { Account, KnowledgeBoxCreation } from '@nuclia/core';
import { map, share } from 'rxjs';
import * as Sentry from '@sentry/angular';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

export interface KbAddData {
  account: Account;
  zones: Zone[];
}

@Component({
  selector: 'app-kb-add',
  templateUrl: './kb-add.component.html',
  styleUrls: ['./kb-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbAddComponent {
  step = 0;
  kbForm = this.formBuilder.group({
    title: ['', [Sluggable()]],
    description: [''],
    zone: [this.data.account.zone],
    selectedLanguage: ['en'],
    languageMode: ['multilingual'],
    useAnonymization: ['no'],
  });

  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      sluggable: 'stash.kb_name_invalid',
    } as IErrorMessages,
  };

  languages: { value: string; label: string }[] = [
    { value: 'multilingual', label: 'stash.create.language.multi' },
    { value: 'monolingual', label: 'stash.create.language.mono' },
  ];
  languageList = ['en'];
  anonymizationOptions: { value: string; label: string }[] = [
    { value: 'no', label: 'generic.disabled' },
    { value: 'yes', label: 'generic.enabled' },
  ];
  hasAnonymization = this.tracking.isFeatureEnabled('kb-anonymization').pipe(share());
  totalSteps = this.hasAnonymization.pipe(map((hasAnonymization) => (hasAnonymization ? 3 : 2)));
  lastStep = this.hasAnonymization.pipe(
    map((hasAnonymization) => {
      const last = hasAnonymization ? 2 : 1;
      this._lastStep = last;
      return last;
    }),
  );
  saving = false;
  creationInProgress = false;
  failures = 0;
  error = '';

  private _lastStep = 1;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dialogRef: MatDialogRef<KbAddComponent, { success: boolean } | undefined>,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    @Inject(MAT_DIALOG_DATA) public data: KbAddData,
    private sdk: SDKService,
  ) {}

  save() {
    // Prevent submitting the form by pressing "enter" in the kb input on first step
    if (this.step < this._lastStep) {
      this.next();
      return;
    }

    if (this.kbForm.invalid) return;

    const payload: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(this.kbForm.value.title),
      zone: this.kbForm.value.zone,
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      sentence_embedder:
        this.kbForm.value.languageMode === 'multilingual' ? 'multilingual' : this.kbForm.value.selectedLanguage,
      anonymization: this.kbForm.value.useAnonymization === 'yes' ? 'multilingual' : '',
    };
    this.saving = true;
    const inProgressTimeout = setTimeout(() => (this.creationInProgress = true), 500);
    this.error = '';
    this.cdr?.markForCheck();
    this.sdk.nuclia.db.createKnowledgeBox(this.data.account.slug, payload).subscribe({
      next: () => {
        clearTimeout(inProgressTimeout);
        this.dialogRef.close({ success: true });
      },
      error: () => {
        clearTimeout(inProgressTimeout);
        this.failures += 1;
        this.saving = false;
        this.creationInProgress = false;
        if (this.failures < 4) {
          this.error = 'stash.create.error';
        } else {
          Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
          this.dialogRef.close({ success: false });
        }
        this.cdr?.markForCheck();
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  next() {
    this.step++;
    this.cdr?.markForCheck();
  }

  back() {
    this.step--;
    this.cdr?.markForCheck();
  }
}
