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
import { filter, takeUntil, tap } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { FeaturesService, UnauthorizedFeatureDirective } from '@flaps/core';
import { RAG_METADATAS, Widget } from '@nuclia/core';
import { FindResourceModalComponent } from '../find-resource-modal';

@Component({
  selector: 'stf-generative-answer-form',
  imports: [
    CommonModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    InfoCardComponent,
    UnauthorizedFeatureDirective,
    PaTextFieldModule,
    BadgeComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './generative-answer-form.component.html',
  styleUrl: './generative-answer-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerativeAnswerFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);
  private modalService = inject(SisModalService);

  @Input() set config(value: Widget.GenerativeAnswerConfig | undefined) {
    if (value) {
      if (value.ragStrategies?.graph) {
        value.ragStrategies.graph.exclude_processor_relations =
          value.ragStrategies.graph.exclude_processor_relations || !!value.ragStrategies.graph.agentic_graph_only;
      }
      this.form.patchValue(value);
    }
  }
  @Input({ required: true }) generativeModels: OptionModel[] = [];
  @Input() defaultPrompt = '';
  @Input() promptInfos: { [model: string]: string } = {};
  @Input() defaultSystemPrompt = '';
  @Input() useSearchResults = true;

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.GenerativeAnswerConfig>();

  form = new FormGroup({
    generateAnswer: new FormControl<boolean>(false, { nonNullable: true }),
    generativeModel: new FormControl<string>('', { nonNullable: true }),
    usePrompt: new FormControl<boolean>(false, { nonNullable: true }),
    prompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSystemPrompt: new FormControl<boolean>(false, { nonNullable: true }),
    systemPrompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    askSpecificResource: new FormControl<boolean>(false, { nonNullable: true }),
    specificResourceSlug: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
    }),
    showReasoning: new FormControl<boolean>(false, { nonNullable: true }),
    reasoningEffort: new FormControl<'low' | 'medium' | 'high'>('medium', {
      nonNullable: true,
      updateOn: 'blur',
    }),
    reasoningBudget: new FormControl<number>(15000, {
      nonNullable: true,
      updateOn: 'blur',
    }),
    limitTokenConsumption: new FormControl<boolean>(false, { nonNullable: true }),
    tokenConsumptionLimit: new FormControl<number | null>(null),
    outputTokenConsumptionLimit: new FormControl<number | null>(null),
    preferMarkdown: new FormControl<boolean>(false, { nonNullable: true }),
    useImages: new FormControl<boolean>(false, { nonNullable: true }),
    imageUsage: new FormControl<'query' | 'context'>('query', { nonNullable: true }),
    ragStrategies: new FormGroup({
      includeTextualHierarchy: new FormControl<boolean>(false, { nonNullable: true }),
      includeNeighbouringParagraphs: new FormControl<boolean>(false, { nonNullable: true }),
      precedingParagraphs: new FormControl<number | null>(null),
      succeedingParagraphs: new FormControl<number | null>(null),
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
      graphRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
      graph: new FormGroup({
        hops: new FormControl<number | null>(3),
        top_k: new FormControl<number | null>(50),
        exclude_processor_relations: new FormControl<boolean>(false, { nonNullable: true }),
        relation_text_as_paragraphs: new FormControl<boolean>(false, { nonNullable: true }),
        generative_relation_ranking: new FormControl<boolean>(false, { nonNullable: true }),
        suggest_query_entity_detection: new FormControl<boolean>(false, { nonNullable: true }),
      }),
      conversationalRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
      conversationOptions: new FormGroup({
        attachmentsText: new FormControl<boolean>(false, { nonNullable: true }),
        attachmentsImages: new FormControl<boolean>(false, { nonNullable: true }),
        full: new FormControl<boolean>(false, { nonNullable: true }),
      }),
      maxMessages: new FormControl<number | null>(null),
      maxNumberOfResources: new FormControl<number | null>(null),
      includeRemaining: new FormControl<boolean>(false, { nonNullable: true }),
      excludeFilter: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
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
  isRagImagesEnabled = this.featuresService.authorized.ragImages;
  metadataIds = Object.values(RAG_METADATAS);
  isGraphSearchEnabled = this.featuresService.authorized.graphSearch;

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
  get showReasoningEnabled() {
    return this.form.controls.showReasoning.value;
  }
  get limitTokenConsumptionEnabled() {
    return this.form.controls.limitTokenConsumption.value;
  }
  get useImages() {
    return this.form.controls.useImages.value;
  }
  get entireResourceAsContextEnabled() {
    return this.form.controls.ragStrategies.controls.entireResourceAsContext.value;
  }
  get metadatasEnabled() {
    return this.form.controls.ragStrategies.controls.metadatasRagStrategy.value;
  }
  get graphEnabled() {
    return this.form.controls.ragStrategies.controls.graphRagStrategy.value;
  }
  get conversationalStrategyEnabled() {
    return this.form.controls.ragStrategies.controls.conversationalRagStrategy.value;
  }
  get attachmentsImagesEnabled() {
    return this.form.controls.ragStrategies.controls.conversationOptions.controls.attachmentsImages.value;
  }
  get fullMessagesEnabled() {
    return this.form.controls.ragStrategies.controls.conversationOptions.controls.full.value;
  }
  get fieldsAsContextEnabled() {
    return this.form.controls.ragStrategies.controls.fieldsAsContext.value;
  }
  get includeNeighbouringParagraphsEnabled() {
    return this.form.controls.ragStrategies.controls.includeNeighbouringParagraphs.value;
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

  searchResource() {
    this.modalService
      .openModal(FindResourceModalComponent)
      .onClose.pipe(filter((resource) => resource))
      .subscribe((resource) => {
        this.form.controls.specificResourceSlug.patchValue(resource.slug);
      });
  }
}
