import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SDKService, STFTrackingService } from '@flaps/auth';
import { CheckboxGroupItem, Sluggable } from '@flaps/common';
import { Zone, STFUtils } from '@flaps/core';
import { Account, KnowledgeBoxCreation } from '@nuclia/core';
import { map, share, switchMap } from 'rxjs';
import * as Sentry from '@sentry/angular';

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
  });

  validationMessages = {
    title: {
      sluggable: 'stash.kb_name_invalid',
    },
  };

  languages: CheckboxGroupItem[] = [
    { value: 'multilingual', label: 'stash.create.language.multi' },
    { value: 'monolingual', label: 'stash.create.language.mono' },
  ];
  languageMode: string[] = ['multilingual'];
  languageList = STFUtils.supportedAudioLanguages();
  anonymizationOptions: CheckboxGroupItem[] = [
    { value: 'no', label: 'generic.disabled' },
    { value: 'yes', label: 'generic.enabled' },
  ];
  useAnonymization = ['no'];
  hasAnonymization = this.tracking.isFeatureEnabled('kb-anonymization').pipe(share());
  totalSteps = this.hasAnonymization.pipe(map((hasAnonymization) => (hasAnonymization ? 3 : 2)));
  lastStep = this.hasAnonymization.pipe(map((hasAnonymization) => (hasAnonymization ? 2 : 1)));
  loading = false;
  failures = 0;
  error = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dialogRef: MatDialogRef<KbAddComponent, { success: boolean } | undefined>,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    @Inject(MAT_DIALOG_DATA) public data: KbAddData,
    private sdk: SDKService,
  ) {}

  save() {
    if (this.kbForm.invalid) return;
    const payload: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(this.kbForm.value.title),
      zone: this.kbForm.value.zone,
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      sentence_embedder: this.languageMode[0] === 'multilingual' ? 'multilingual' : this.kbForm.value.selectedLanguage,
      anonymization: this.useAnonymization[0] === 'yes' ? 'multilingual' : '',
    };
    this.loading = true;
    this.error = '';
    this.cdr?.markForCheck();
    this.sdk.nuclia.db.createKnowledgeBox(this.data.account.slug, payload).subscribe({
      next: () => this.dialogRef.close({ success: true }),
      error: () => {
        this.failures += 1;
        this.loading = false;
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
