import {
  ChangeDetectionStrategy,
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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, take, takeUntil } from 'rxjs';
import { LearningConfigurationOption, LearningConfigurations } from '@nuclia/core';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';
import { keyProviders } from '../../ai-models.utils';

export type UserKeysForm = FormGroup<{
  enabled: FormControl<boolean>;
  user_keys: FormGroup<{ [key: string]: any }>;
}>;

@Component({
  selector: 'stf-user-keys',
  imports: [
    CommonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    UnauthorizedFeatureDirective,
  ],
  templateUrl: './user-keys.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserKeysComponent implements OnChanges, OnDestroy, OnInit {
  keyProviders = keyProviders;
  modelsRequiringUserKey = ['huggingface'];

  @Input() learningConfigurations?: LearningConfigurations;
  @Input() generativeModel?: LearningConfigurationOption;
  @Output() formReady = new EventEmitter<UserKeysForm>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['learningConfigurations'] || changes['generativeModel']) {
      this.updateForm();
    }
  }

  form: UserKeysForm = new FormGroup({
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    user_keys: new FormGroup({}),
  });

  required = this.translate.instant('kb.ai-models.common.required');
  isUserPromptsAuthorized = this.features.authorized.userPrompts;
  unsubscribeAll = new Subject<void>();

  get userKeysToggle() {
    return this.form.controls.enabled;
  }
  get hasOwnKey() {
    return !!this.userKeysToggle.value;
  }
  get userKeysGroup() {
    return this.form.controls.user_keys;
  }

  constructor(
    private translate: TranslateService,
    private features: FeaturesService,
  ) {
    this.userKeysToggle.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.updateValidators();
    });
    this.isUserPromptsAuthorized.pipe(take(1)).subscribe((authorized) => {
      if (!authorized) {
        this.form.disable();
      }
    });
  }

  ngOnInit() {
    this.formReady.emit(this.form);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onOwnKeyToggle() {
    this.form.markAsDirty();
  }

  updateForm() {
    if (!this.learningConfigurations || !this.generativeModel) {
      return;
    }
    if (this.generativeModel.user_key) {
      // add user_keys controls corresponding to generative model if any
      const newUserKeys = Object.keys(
        this.learningConfigurations['user_keys'].schemas?.[this.generativeModel?.user_key]?.properties || {},
      );
      Object.keys(this.userKeysGroup.controls).forEach((oldKey) => {
        if (newUserKeys.includes(oldKey)) {
          // clean up value from previous fields
          this.userKeysGroup.get(oldKey)?.patchValue('');
        } else {
          // remove unused control
          this.userKeysGroup.removeControl(oldKey);
        }
      });
      newUserKeys.forEach((key) => {
        if (!this.userKeysGroup.get(key)) {
          this.userKeysGroup.addControl(key, new FormControl<string>(''));
        }
      });
      this.updateValidators();
    }
    this.userKeysToggle.patchValue(this.modelsRequiringUserKey.includes(this.generativeModel?.value || ''));
  }

  updateValidators() {
    if (!this.learningConfigurations || !this.generativeModel) {
      return;
    }
    const required =
      this.learningConfigurations['user_keys'].schemas?.[this.generativeModel.user_key || '']?.required || [];
    Object.keys(this.userKeysGroup.controls).forEach((key) => {
      this.userKeysGroup.get(key)?.setValidators(this.hasOwnKey && required.includes(key) ? [Validators.required] : []);
      this.userKeysGroup.get(key)?.markAsPristine();
      this.userKeysGroup.get(key)?.updateValueAndValidity();
    });
  }
}
