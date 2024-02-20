import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeaturesService, getSemanticModel, SDKService, STFUtils, Zone } from '@flaps/core';
import { Account, KnowledgeBoxCreation } from '@nuclia/core';
import { IErrorMessages, ModalRef } from '@guillotinaweb/pastanaga-angular';
import * as Sentry from '@sentry/angular';
import { SisToastService } from '@nuclia/sistema';
import { switchMap } from 'rxjs';

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
  kbForm = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    anonymization: new FormControl<boolean>(false, { nonNullable: true }),
  });
  multilingualSelected = true;
  languages: string[] = [];

  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      required: 'validation.required',
    },
  };
  totalSteps = 2;
  step = 0;
  lastStep = 1;
  saving = false;
  creationInProgress = false;
  failures = 0;
  zones: Zone[] = [];
  account?: Account;

  isAnonymizationEnabled = this.features.kbAnonymization;

  private _lastStep = 1;

  constructor(
    public modal: ModalRef<KbAddData>,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private toast: SisToastService,
    private features: FeaturesService,
  ) {}

  ngOnInit(): void {
    this.account = this.modal.config.data?.account;
    this.zones = this.modal.config.data?.zones || [];
    if (this.zones.length === 1) {
      this.kbForm.controls.zone.patchValue(this.zones[0].slug);
    }
  }

  updateLanguages(data: { multilingualSelected: boolean; languages: string[] }) {
    this.multilingualSelected = data.multilingualSelected;
    this.languages = data.languages;
    this.cdr.markForCheck();
  }

  save() {
    // Prevent submitting the form by pressing "enter" in the kb input on first step
    if (this.step < this._lastStep) {
      this.next();
      return;
    } else if (this.kbForm.invalid || !this.account) {
      return;
    }

    this.saving = true;
    const kbConfig = this.kbForm.getRawValue();
    const accountId = this.account.id;

    const inProgressTimeout = setTimeout(() => (this.creationInProgress = true), 500);
    this.cdr.markForCheck();

    this.sdk.nuclia.db
      .getLearningSchema(accountId, kbConfig.zone)
      .pipe(
        switchMap((learningConfiguration) => {
          const payload: KnowledgeBoxCreation = {
            slug: STFUtils.generateSlug(kbConfig.title),
            title: kbConfig.title,
            description: kbConfig.description,
            learning_configuration: {
              anonymization_model: kbConfig.anonymization ? 'multilingual' : 'disabled',
              semantic_model: getSemanticModel(
                {
                  multilingual: this.multilingualSelected,
                  languages: this.languages,
                },
                learningConfiguration,
              ),
            },
          };

          return this.sdk.nuclia.db.createKnowledgeBox(accountId, payload, kbConfig.zone);
        }),
      )
      .subscribe({
        next: () => {
          clearTimeout(inProgressTimeout);
          this.modal.close({ success: true });
        },
        error: () => {
          clearTimeout(inProgressTimeout);
          this.failures += 1;
          this.saving = false;
          this.creationInProgress = false;
          if (this.failures < 4) {
            this.toast.error('kb.create.error');
          } else {
            Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
            this.modal.close({ success: false });
          }
          this.cdr.markForCheck();
        },
      });
  }

  close(): void {
    this.modal.close();
  }

  next() {
    this.step++;
    this.cdr.markForCheck();
  }

  back() {
    this.step--;
    this.cdr.markForCheck();
  }
}
