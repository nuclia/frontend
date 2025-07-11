import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SDKService } from '@flaps/core';
import {
  PaButtonModule,
  PaCardModule,
  PaExpanderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LearningConfiguration, Prompts, Widget } from '@nuclia/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { combineLatest, Observable, tap } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { getChatOptions, SearchWidgetService } from '../../search-widget';
import { LabLayoutComponent } from '../lab-layout/lab-layout.component';
import { RequestConfigAndQueries } from '../rag-lab.models';
import { RagLabService } from '../rag-lab.service';

@Component({
  selector: 'stf-prompt-lab',
  imports: [
    CommonModule,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaCardModule,
    LabLayoutComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './prompt-lab.component.html',
  styleUrl: '../_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptLabComponent implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private ragLabService = inject(RagLabService);
  private searchWidgetService = inject(SearchWidgetService);
  private sdk = inject(SDKService);

  generativeModels: Observable<LearningConfiguration> = this.ragLabService.generativeModelList.pipe(
    filter((models) => !!models),
    map((models) => models as LearningConfiguration),
    tap((models) => {
      models.options?.forEach((model) => {
        this.form.addControl(model.value, new FormControl<boolean>(false, { nonNullable: true }));
      });
      this.updateFormContent();
      this.cdr.detectChanges();
    }),
  );
  searchConfigurations = this.ragLabService.searchConfigurations;
  selectedConfig = combineLatest([this.sdk.currentKb, this.searchConfigurations]).pipe(
    map(([kb, configs]) => this.searchWidgetService.getSelectedSearchConfig(kb.id, configs)),
  );

  @ViewChild('labLayout', { read: LabLayoutComponent }) labLayoutComponent?: LabLayoutComponent;

  form = new FormGroup({});
  currentConfig?: string;
  currentPrompt = '';
  currentSystemPrompt = '';
  queries: string[] = [];
  promptExamples = [
    this.translate.instant('rag-lab.prompt-lab.configuration.prompt.examples.first-example'),
    this.translate.instant('rag-lab.prompt-lab.configuration.prompt.examples.second-example'),
    this.translate.instant('rag-lab.prompt-lab.configuration.prompt.examples.third-example'),
  ];
  systemPromptExamples = [
    this.translate.instant('rag-lab.prompt-lab.configuration.system-prompt.examples.first-example'),
    this.translate.instant('rag-lab.prompt-lab.configuration.system-prompt.examples.second-example'),
    this.translate.instant('rag-lab.prompt-lab.configuration.system-prompt.examples.third-example'),
  ];

  get selectedModels(): string[] {
    return Object.entries(this.form.getRawValue())
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  constructor() {
    this.selectedConfig.pipe(take(1)).subscribe((config) => {
      this.currentConfig = config.id;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.currentPrompt = '';
    this.currentSystemPrompt = '';
  }

  updateFormContent() {
    this.labLayoutComponent?.formContainer?.updateContentHeight();
  }

  onQueriesChange(queries: string[]) {
    this.queries = queries;
    this.updateFormContent();
  }

  generate() {
    if (this.queries.length === 0 || this.selectedModels.length === 0 || !this.currentConfig) {
      return;
    }
    this.searchConfigurations
      .pipe(
        take(1),
        switchMap((configs) => {
          const selectedConfig = configs.find(
            (config) => config.id === this.currentConfig,
          ) as Widget.SearchConfiguration;
          const requestOptions = getChatOptions(selectedConfig);
          const rephrasePrompt =
            typeof requestOptions?.prompt === 'string' ? undefined : requestOptions?.prompt?.rephrase;
          let prompt: Prompts | undefined;
          if (this.currentPrompt || this.currentSystemPrompt || rephrasePrompt) {
            prompt = {
              user: this.currentPrompt || undefined,
              system: this.currentSystemPrompt || undefined,
              rephrase: rephrasePrompt || undefined,
            };
          }
          const options: RequestConfigAndQueries[] = this.selectedModels.map((model) => ({
            ...requestOptions,
            queries: this.queries,
            generative_model: model,
            prompt,
          }));
          return this.ragLabService.generate(options, 'prompt');
        }),
      )
      .subscribe();
  }

  downloadCsv() {
    this.ragLabService.downloadPromptLabCsv(this.selectedModels);
  }

  setPrompt(value: string) {
    if (value) {
      this.currentPrompt = value;
      this.cdr.markForCheck();
    }
  }

  setSystemPrompt(value: string) {
    if (value) {
      this.currentSystemPrompt = value;
      this.cdr.markForCheck();
    }
  }
}
