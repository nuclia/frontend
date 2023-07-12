import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { SDKService, STFUtils, VisibleLearningConfiguration, Zone } from '@flaps/core';
import { Sluggable } from '@flaps/common';
import { Account, KnowledgeBoxCreation, LearningConfiguration } from '@nuclia/core';
import * as Sentry from '@sentry/angular';
import { IErrorMessages, ModalRef } from '@guillotinaweb/pastanaga-angular';

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
  displayedLearningConfigurations?: VisibleLearningConfiguration[];
  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      sluggable: 'stash.kb_name_invalid',
    } as IErrorMessages,
  };
  totalSteps = 2;
  lastStep = 1;
  saving = false;
  creationInProgress = false;
  failures = 0;
  error = '';

  private _lastStep = 1;

  constructor(
    public modal: ModalRef,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    this.sdk.getVisibleLearningConfiguration().subscribe(({ display, full }) => {
      this.displayedLearningConfigurations = display;
      this.learningConfigurations = full;
      this.kbForm = this.formBuilder.group({
        title: ['', [Sluggable()]],
        description: [''],
        zone: [this.modal.config.data?.account.zone],
        config: this.formBuilder.group(
          this.displayedLearningConfigurations.reduce((acc, entry) => {
            return {
              ...acc,
              [entry.id]: [entry.data.default],
              ...entry.data.options.reduce((acc, option) => {
                option.fields.forEach((field) => {
                  acc[field.value] = [''];
                });
                return acc;
              }, {} as { [key: string]: any }),
            };
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
    const fields = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
      this.getVisibleFields(entry).forEach((field) => {
        acc[field.value] = this.kbForm?.value.config[field.value];
      });
      return acc;
    }, {} as { [key: string]: string });

    const payload: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(this.kbForm.value.title),
      zone: this.kbForm.value.zone,
      title: this.kbForm.value.title,
      description: this.kbForm.value.description,
      learning_configuration: { ...learning_configuration, ...fields },
    };
    this.saving = true;
    const inProgressTimeout = setTimeout(() => (this.creationInProgress = true), 500);
    this.error = '';
    this.cdr?.markForCheck();
    this.sdk.nuclia.db.createKnowledgeBox(this.modal.config.data?.account.slug, payload).subscribe({
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
          this.error = 'stash.create.error';
        } else {
          Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
          this.modal.close({ success: false });
        }
        this.cdr?.markForCheck();
      },
    });
  }

  getVisibleFields(conf: VisibleLearningConfiguration) {
    const selectedOption = this.kbForm?.value['config'][conf.id] || '';
    return conf.data.options.find((option) => option.value === selectedOption)?.fields || [];
  }

  close(): void {
    this.modal.close();
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
