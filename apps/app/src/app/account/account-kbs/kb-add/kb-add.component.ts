import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Account, STFTrackingService } from '@flaps/auth';
import { CheckboxGroupItem, Sluggable } from '@flaps/common';
import { Zone, STFUtils } from '@flaps/core';
import { KnowledgeBoxCreation } from '@nuclia/core';
import { map, share } from 'rxjs';

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

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<KbAddComponent, KnowledgeBoxCreation | undefined>,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    @Inject(MAT_DIALOG_DATA) public data: KbAddData,
  ) {}

  save() {
    if (this.kbForm.invalid) return;
    this.dialogRef.close({
      slug: STFUtils.generateSlug(this.kbForm.value.title),
      zone: this.kbForm.value.zone,
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      sentence_embedder: this.languageMode[0] === 'multilingual' ? 'multilingual' : this.kbForm.value.selectedLanguage,
      anonymization: this.useAnonymization[0] === 'yes' ? 'multilingual' : '',
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
