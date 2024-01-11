import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { getSemanticModel, SDKService, STFUtils, Zone } from '@flaps/core';
import { Sluggable } from '../validators';
import { KnowledgeBoxSettingsService } from '../knowledge-box-settings';
import { Account, KnowledgeBoxCreation, LearningConfiguration, LearningConfigurations } from '@nuclia/core';
import * as Sentry from '@sentry/angular';
import { IErrorMessages, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';

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
  totalSteps = 2;
  lastStep = 1;
  saving = false;
  creationInProgress = false;
  failures = 0;
  error = '';
  zones: Zone[] = [];
  account?: Account;

  multilingualSelected = true;
  languages: string[] = [];

  private _lastStep = 1;

  constructor(
    public modal: ModalRef<KbAddData>,
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private translate: TranslateService,
    private kbSettingsService: KnowledgeBoxSettingsService,
  ) {}

  ngOnInit(): void {
    this.account = this.modal.config.data?.account;
    this.zones = this.modal.config.data?.zones || [];
    this.kbSettingsService.getVisibleLearningConfiguration().subscribe(({ display, full }) => {
      this.displayedLearningConfigurations = display;
      this.learningConfigurations = full;
      this.kbForm = this.formBuilder.group({
        title: ['', [Sluggable()]],
        description: [''],
        zone: [this.zones.length === 1 ? this.zones[0].slug : ''],
        config: this.formBuilder.group(
          this.displayedLearningConfigurations.reduce(
            (acc, entry) => {
              acc[entry.id] = [entry.data.default];
              return acc;
            },
            {} as { [key: string]: any },
          ),
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

    if (!this.kbForm || this.kbForm.invalid || !this.account) return;

    const default_learning_configuration = (this.learningConfigurations || []).reduce(
      (acc, entry) => {
        acc[entry.id] = entry.data.default;
        return acc;
      },
      {} as { [key: string]: string },
    );
    const formValue = this.kbForm.getRawValue();
    const learning_configuration = (this.displayedLearningConfigurations || []).reduce((acc, entry) => {
      acc[entry.id] = formValue.config[entry.id];
      return acc;
    }, default_learning_configuration);

    const learningConf = (this.learningConfigurations || []).reduce((acc, entry) => {
      acc[entry.id] = entry.data;
      return acc;
    }, {} as LearningConfigurations);
    learning_configuration['semantic_model'] = getSemanticModel(
      {
        languages: this.languages,
        multilingual: this.multilingualSelected,
      },
      learningConf,
    );

    const payload: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(formValue.title),
      title: formValue.title,
      description: formValue.description,
      learning_configuration,
    };
    this.saving = true;
    const inProgressTimeout = setTimeout(() => (this.creationInProgress = true), 500);
    this.error = '';
    this.cdr?.markForCheck();
    this.sdk.nuclia.db.createKnowledgeBox(this.account.id, payload, formValue.zone).subscribe({
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

  updateLanguages(data: { multilingualSelected: boolean; languages: string[] }) {
    console.log(`updateLanguages`, data);
    this.multilingualSelected = data.multilingualSelected;
    this.languages = data.languages;
    this.cdr.markForCheck();
  }
}
