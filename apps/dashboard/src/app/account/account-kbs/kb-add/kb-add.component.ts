import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SDKService, STFTrackingService, STFUtils, Zone } from '@flaps/core';
import { Sluggable } from '@flaps/common';
import { Account, KnowledgeBoxCreation, LearningConfiguration } from '@nuclia/core';
import { forkJoin, share, take } from 'rxjs';
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
export class KbAddComponent implements OnInit {
  step = 0;
  kbForm?: UntypedFormGroup;
  learningConfigurations?: { id: string; data: LearningConfiguration }[];
  displayedLearningConfigurations?: { id: string; data: LearningConfiguration }[];
  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      sluggable: 'stash.kb_name_invalid',
    } as IErrorMessages,
  };
  hasAnonymization = this.tracking.isFeatureEnabled('kb-anonymization').pipe(share());
  totalSteps = 2;
  lastStep = 1;
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

  ngOnInit(): void {
    forkJoin([
      this.tracking.isFeatureEnabled('kb-anonymization').pipe(take(1)),
      this.sdk.nuclia.db.getLearningConfigurations().pipe(take(1)),
    ]).subscribe(([hasAnonymization, conf]) => {
      this.learningConfigurations = Object.entries(conf).map(([id, data]) => ({ id, data }));
      // Hide configurations with only one option or under feature flagging
      this.displayedLearningConfigurations = this.learningConfigurations.filter(
        (entry) => entry.data.options.length > 1 || (entry.id === 'anonymization_model' && !hasAnonymization),
      );
      this.kbForm = this.formBuilder.group({
        title: ['', [Sluggable()]],
        description: [''],
        zone: [this.data.account.zone],
        config: this.formBuilder.group(
          this.displayedLearningConfigurations.reduce((acc, entry) => {
            acc[entry.id] = [entry.data.default];
            return acc;
          }, {} as { [key: string]: any }),
        ),
      });
      this.cdr.markForCheck();
    });
  }
  save() {
    // Prevent submitting the form by pressing "enter" in the kb input on first step
    if (this.step < this._lastStep) {
      this.next();
      return;
    }

    if (!this.kbForm || this.kbForm.invalid) return;

    const default_learning_configuration = (this.learningConfigurations || []).reduce((acc, entry) => {
      acc[entry.id] = entry.data.default;
      return acc;
    }, {} as { [key: string]: string });
    const learning_configuration = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
      acc[entry.id] = this.kbForm?.value.config[entry.id];
      return acc;
    }, default_learning_configuration);

    const payload: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(this.kbForm.value.title),
      zone: this.kbForm.value.zone,
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      learning_configuration,
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
