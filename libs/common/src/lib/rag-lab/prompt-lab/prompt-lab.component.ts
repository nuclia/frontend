import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaButtonModule,
  PaCardModule,
  PaExpanderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { Observable, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LearningConfiguration, Prompts } from '@nuclia/core';
import { LineBreakFormatterPipe } from '../../pipes';
import { QuestionBlockComponent } from '../question-block';
import { RagLabService } from '../rag-lab.service';
import { LabLayoutComponent } from '../lab-layout/lab-layout.component';
import { RequestConfigAndQueries } from '../rag-lab.models';

@Component({
  selector: 'stf-prompt-lab',
  standalone: true,
  imports: [
    CommonModule,
    LineBreakFormatterPipe,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaCardModule,
    QuestionBlockComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    LabLayoutComponent,
  ],
  templateUrl: './prompt-lab.component.html',
  styleUrl: '../_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptLabComponent implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private ragLabService = inject(RagLabService);

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

  @ViewChild('labLayout', { read: LabLayoutComponent }) labLayoutComponent?: LabLayoutComponent;

  form = new FormGroup({});
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
    if (this.queries.length === 0 || this.selectedModels.length === 0) {
      return;
    }

    let prompt: Prompts | undefined;
    if (this.currentPrompt || this.currentSystemPrompt) {
      prompt = {
        user: this.currentPrompt || undefined,
        system: this.currentSystemPrompt || undefined,
      };
    }
    const options: RequestConfigAndQueries[] = this.selectedModels.map((model) => ({
      queries: this.queries,
      generative_model: model,
      prompt,
    }));
    this.ragLabService.generate(options, 'prompt').subscribe();
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
