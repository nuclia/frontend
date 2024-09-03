import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaButtonModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { QuestionBlockComponent } from './question-block';
import { InfoCardComponent } from '@nuclia/sistema';
import { RouterLink } from '@angular/router';
import { RagLabService } from './rag-lab.service';
import { forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
import { LabLayoutComponent } from './lab-layout/lab-layout.component';
import { RequestConfig } from './rag-lab.models';
import { getPreselectedFilterList, getRagStrategies, SearchConfiguration } from '../search-widget';
import { getRAGImageStrategies, getRAGStrategies } from '@nuclia/core';

@Component({
  selector: 'stf-rag-lab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    QuestionBlockComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaTogglesModule,
    InfoCardComponent,
    RouterLink,
    PaButtonModule,
    LabLayoutComponent,
  ],
  templateUrl: './rag-lab.component.html',
  styleUrl: './_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagLabComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);
  private ragLabService = inject(RagLabService);

  defaultGenerativeModel: Observable<string> = this.ragLabService.kbConfigBackup.pipe(
    map((kbConfig) => kbConfig?.['generative_model'] || ''),
  );
  generativeModelMap = this.ragLabService.generativeModelMap;
  searchConfigurations = this.ragLabService.searchConfigurations.pipe(
    tap((configs) => {
      configs.forEach((config) =>
        this.form.addControl(config.id, new FormControl<boolean>(false, { nonNullable: true })),
      );
      this.updateFormContent();
      this.cdr.detectChanges();
    }),
  );

  @ViewChild('labLayout', { read: LabLayoutComponent }) labLayoutComponent?: LabLayoutComponent;

  form = new FormGroup({});

  queries: string[] = [];

  get selectedConfigs(): string[] {
    return Object.entries(this.form.getRawValue())
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  ngOnChanges(): void {
    setTimeout(() => this.updateFormContent());
  }

  onQueriesChange(queries: string[]) {
    this.queries = queries;
    this.updateFormContent();
  }

  updateFormContent() {
    this.labLayoutComponent?.formContainer?.updateContentHeight();
  }

  generate() {
    if (this.queries.length === 0 || this.selectedConfigs.length === 0) {
      return;
    }

    forkJoin([this.searchConfigurations.pipe(take(1)), this.defaultGenerativeModel.pipe(take(1))])
      .pipe(
        switchMap(([configurations, defaultGenerativeModel]) => {
          const options: RequestConfig[] = this.getRequestConfigList(configurations, defaultGenerativeModel);
          const queries: string[] = this.queries;
          // TODO refactoring for queryPrepend option
          return this.ragLabService.generate(queries, options, 'rag');
        }),
      )
      .subscribe();
  }

  downloadCsv() {
    //TODO
    // this.ragLabService.downloadCsv(this.selectedModels);
  }

  private getRequestConfigList(configurations: SearchConfiguration[], defaultGenerativeModel: string): RequestConfig[] {
    return this.selectedConfigs
      .map((configId) => {
        const searchConfig = configurations.find((conf) => conf.id === configId);
        if (!searchConfig) {
          return null;
        }
        const requestConfig: RequestConfig = {
          searchConfigId: configId,
          generative_model: searchConfig.generativeAnswer.generativeModel || defaultGenerativeModel,
          vectorset: searchConfig.generativeAnswer.vectorset || undefined,
          highlight: true, // highlight is set to true by default on the widget, so we do the same here
          rephrase: searchConfig.searchBox.rephraseQuery,
          autofilter: searchConfig.searchBox.autofilter,
          prefer_markdown: searchConfig.generativeAnswer.preferMarkdown,
          citations: searchConfig.resultDisplay.showResultType === 'citations',
        };
        if (searchConfig.generativeAnswer.prompt || searchConfig.generativeAnswer.systemPrompt) {
          requestConfig.prompt = {
            user: searchConfig.generativeAnswer.prompt || undefined,
            system: searchConfig.generativeAnswer.systemPrompt || undefined,
          };
        }
        if (searchConfig.searchBox.setPreselectedFilters) {
          requestConfig.filters = getPreselectedFilterList(searchConfig.searchBox);
        }
        if (searchConfig.generativeAnswer.ragStrategies) {
          const { ragStrategies, ragImagesStrategies } = getRagStrategies(searchConfig.generativeAnswer.ragStrategies);
          requestConfig.rag_strategies = getRAGStrategies(ragStrategies);
          requestConfig.rag_images_strategies = getRAGImageStrategies(ragImagesStrategies);
        }
        if (
          searchConfig.generativeAnswer.limitTokenConsumption &&
          searchConfig.generativeAnswer.tokenConsumptionLimit
        ) {
          requestConfig.max_tokens = searchConfig.generativeAnswer.tokenConsumptionLimit;
        }
        if (searchConfig.generativeAnswer.limitParagraphs && !!searchConfig.generativeAnswer.paragraphsLimit) {
          requestConfig.top_k = searchConfig.generativeAnswer.paragraphsLimit;
        }
        return requestConfig;
      })
      .filter((config) => !!config);
  }
}
