import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { GenerativeAnswerConfig, MODELS_SUPPORTING_VISION } from '../../search-widget.models';
import { takeUntil, tap } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OptionModel, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';
import { RouterLink } from '@angular/router';
import { RAG_METADATAS } from '@nuclia/core';

@Component({
  selector: 'stf-generative-answer-form',
  standalone: true,
  imports: [
    CommonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    InfoCardComponent,
    UnauthorizedFeatureDirective,
    RouterLink,
    PaTextFieldModule,
  ],
  templateUrl: './generative-answer-form.component.html',
  styleUrl: './generative-answer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerativeAnswerFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);

  @Input() set config(value: GenerativeAnswerConfig | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input({ required: true }) generativeModels: OptionModel[] = [];
  @Input({ required: true }) semanticModels: OptionModel[] = [];
  @Input() defaultPrompt = '';
  @Input() promptInfos: { [model: string]: string } = {};
  @Input() defaultSystemPrompt = '';

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<GenerativeAnswerConfig>();

  form = new FormGroup({
    generateAnswer: new FormControl<boolean>(false, { nonNullable: true }),
    generativeModel: new FormControl<string>('', { nonNullable: true }),
    vectorset: new FormControl<string>('', { nonNullable: true }),
    usePrompt: new FormControl<boolean>(false, { nonNullable: true }),
    prompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSystemPrompt: new FormControl<boolean>(false, { nonNullable: true }),
    systemPrompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    askSpecificResource: new FormControl<boolean>(false, { nonNullable: true }),
    specificResourceSlug: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
    }),
    limitTokenConsumption: new FormControl<boolean>(false, { nonNullable: true }),
    tokenConsumptionLimit: new FormControl<number | null>(null),
    preferMarkdown: new FormControl<boolean>(false, { nonNullable: true }),
    ragStrategies: new FormGroup({
      includeTextualHierarchy: new FormControl<boolean>(false, { nonNullable: true }),
      additionalCharacters: new FormControl<number | null>(null),
      entireResourceAsContext: new FormControl<boolean>(false, { nonNullable: true }),
      metadatasRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
      metadatas: new FormGroup(
        Object.values(RAG_METADATAS).reduce(
          (controls, metadata) => {
            controls[metadata] = new FormControl<boolean>(false, { nonNullable: true });
            return controls;
          },
          {} as Record<RAG_METADATAS, FormControl<boolean>>,
        ),
      ),
      maxNumberOfResources: new FormControl<number | null>(null),
      fieldsAsContext: new FormControl<boolean>(false, { nonNullable: true }),
      fieldIds: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
      includePageImages: new FormControl<boolean>(false, { nonNullable: true }),
      maxNumberOfImages: new FormControl<number | null>(null),
      includeParagraphImages: new FormControl<boolean>(false, { nonNullable: true }),
    }),
  });

  userPromptsAuthorized = this.featuresService.authorized.userPrompts.pipe(
    tap((authorized) => {
      if (authorized) {
        this.form.controls.usePrompt.enable();
        this.form.controls.useSystemPrompt.enable();
      } else {
        this.form.controls.usePrompt.disable();
        this.form.controls.useSystemPrompt.disable();
      }
    }),
  );
  userPromptInfo = '';
  userPromptOverridden = false;
  systemPromptOverridden = false;
  isRagImagesEnabled = this.featuresService.unstable.ragImages;
  metadataIds = Object.values(RAG_METADATAS);

  get generateAnswerEnabled() {
    return this.form.controls.generateAnswer.value;
  }
  get usePromptEnabled() {
    return this.form.controls.usePrompt.value;
  }
  get useSystemPromptEnabled() {
    return this.form.controls.useSystemPrompt.value;
  }
  get askSpecificResourceEnabled() {
    return this.form.controls.askSpecificResource.value;
  }
  get limitTokenConsumptionEnabled() {
    return this.form.controls.limitTokenConsumption.value;
  }
  get entireResourceAsContextEnabled() {
    return this.form.controls.ragStrategies.controls.entireResourceAsContext.value;
  }
  get metadatasEnabled() {
    return this.form.controls.ragStrategies.controls.metadatasRagStrategy.value;
  }
  get fieldsAsContextEnabled() {
    return this.form.controls.ragStrategies.controls.fieldsAsContext.value;
  }
  get includeTextualHierarchyEnabled() {
    return this.form.controls.ragStrategies.controls.includeTextualHierarchy.value;
  }
  get includePageImagesEnabled() {
    return this.form.controls.ragStrategies.controls.includePageImages.value;
  }
  get includePageImagesControl() {
    return this.form.controls.ragStrategies.controls.includePageImages;
  }
  get includeParagraphImagesControl() {
    return this.form.controls.ragStrategies.controls.includeParagraphImages;
  }
  get currentModel() {
    return this.form.controls.generativeModel.value;
  }
  get notSupportingVision() {
    return !MODELS_SUPPORTING_VISION.includes(this.currentModel);
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((value) => {
      const currentPrompt = this.form.controls.prompt.value.trim();
      this.userPromptOverridden = !!currentPrompt && currentPrompt !== this.defaultPrompt && !!value.usePrompt;
      if (value.generativeModel && this.promptInfos[value.generativeModel]) {
        this.userPromptInfo = this.promptInfos[value.generativeModel];
      }
      const currentSystemPrompt = this.form.controls.systemPrompt.value.trim();
      this.systemPromptOverridden =
        !!currentSystemPrompt && currentSystemPrompt !== this.defaultSystemPrompt && !!value.useSystemPrompt;
      this.configChanged.emit({ ...this.form.getRawValue() });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  checkVisionModelSupport() {
    if (this.notSupportingVision) {
      this.form.controls.ragStrategies.patchValue({
        includePageImages: false,
        includeParagraphImages: false,
      });
      this.includePageImagesControl.disable();
      this.includeParagraphImagesControl.disable();
    } else {
      this.includePageImagesControl.enable();
      this.includeParagraphImagesControl.enable();
    }
    this.heightChanged.emit();
  }
}
