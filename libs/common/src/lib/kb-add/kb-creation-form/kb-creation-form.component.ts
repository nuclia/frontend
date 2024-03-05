import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IErrorMessages, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FeaturesService, getSemanticModel, SDKService, Zone } from '@flaps/core';
import { LanguageFieldComponent } from '@nuclia/user';
import { SisProgressModule } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface KbConfig {
  title: string;
  description: string;
  zone: string;
}

export interface LearningConfig {
  anonymization_model: string;
  semantic_model: string;
}

@Component({
  selector: 'stf-kb-creation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LanguageFieldComponent,
    ReactiveFormsModule,
    SisProgressModule,
    TranslateModule,
    PaTextFieldModule,
    PaTogglesModule,
  ],
  templateUrl: './kb-creation-form.component.html',
  styleUrl: './kb-creation-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbCreationFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() accountId?: string;
  @Input() zones: Zone[] = [];
  @Input({ transform: booleanAttribute })
  set creationInProgress(creating: boolean) {
    if (creating) {
      this.kbForm.disable();
    } else {
      this.kbForm.enable();
    }
  }

  @Output() kbConfig = new EventEmitter<KbConfig>();
  @Output() learningConfig = new EventEmitter<LearningConfig>();

  unsubscribeAll = new Subject<void>();
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

  isAnonymizationEnabled = this.features.kbAnonymization;

  constructor(
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private sdk: SDKService,
  ) {}

  ngOnInit() {
    this.kbForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const { anonymization, ...kbConfig } = this.kbForm.getRawValue();
      this.kbConfig.emit(kbConfig);
    });
    // Learning schema depends on the zone and on anonymization, so if one of them changes, we make sure to compute and emit again the learning configuration
    this.kbForm.controls.zone.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.computeAndEmitLearningConfig());
    this.kbForm.controls.anonymization.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.computeAndEmitLearningConfig());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['zones'].currentValue) {
      if (this.zones.length === 1) {
        this.kbForm.controls.zone.patchValue(this.zones[0].slug);
      } else if (this.zones.length === 0) {
        this.kbForm.controls.zone.clearValidators();
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateLanguages(data: { multilingualSelected: boolean; languages: string[] }) {
    this.multilingualSelected = data.multilingualSelected;
    this.languages = data.languages;
    this.cdr.markForCheck();

    this.computeAndEmitLearningConfig();
  }

  private computeAndEmitLearningConfig() {
    const { anonymization, ...kbConfig } = this.kbForm.getRawValue();
    if (this.accountId && kbConfig.zone) {
      this.sdk.nuclia.db.getLearningSchema(this.accountId, kbConfig.zone).subscribe((learningConfiguration) => {
        this.learningConfig.emit({
          anonymization_model: anonymization ? 'multilingual' : 'disabled',
          semantic_model: getSemanticModel(
            {
              multilingual: this.multilingualSelected,
              languages: this.languages,
            },
            learningConfiguration,
          ),
        });
      });
    }
  }
}
