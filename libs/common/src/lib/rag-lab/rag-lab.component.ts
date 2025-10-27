import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { RouterLink } from '@angular/router';
import { RagLabService } from './rag-lab.service';
import { forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
import { LabLayoutComponent } from './lab-layout/lab-layout.component';
import { RequestConfigAndQueries } from './rag-lab.models';
import { getChatOptions } from '../search-widget';
import { Widget } from '@nuclia/core';

@Component({
  selector: 'stf-rag-lab',
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaTogglesModule,
    InfoCardComponent,
    RouterLink,
    PaButtonModule,
    LabLayoutComponent,
    PaPopupModule,
    PaIconModule,
  ],
  templateUrl: './rag-lab.component.html',
  styleUrl: './_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagLabComponent implements OnChanges {
  private cdr = inject(ChangeDetectorRef);
  private ragLabService = inject(RagLabService);
  private translate = inject(TranslateService);

  defaultGenerativeModel: Observable<string> = this.ragLabService.kbConfigBackup.pipe(
    map((kbConfig) => kbConfig?.['generative_model'] || ''),
  );
  generativeModelMap = this.ragLabService.generativeModelMap;
  searchConfigurations: Observable<Widget.SearchConfiguration[]> = this.ragLabService.searchConfigurations.pipe(
    tap((configs) => {
      configs.forEach((config) =>
        this.form.addControl(config.id, new FormControl<boolean>(false, { nonNullable: true })),
      );
      this.updateFormContent();
      this.cdr.detectChanges();
    }),
  );

  searchConfigDetails: Observable<{ vectorset?: string; features: string[]; ragStrategies: string[] }[]> =
    this.searchConfigurations.pipe(
      map((configs) =>
        configs.map((config) => {
          const features: string[] = [];
          if (config.searchBox.rephraseQuery) {
            features.push(this.translate.instant('search.configuration.search-box.rephrase.toggle-label'));
          }
          if (config.searchBox.setPreselectedFilters && config.searchBox.preselectedFilters) {
            features.push(this.translate.instant('search.configuration.search-box.preselected-filters.toggle-label'));
          }
          if (config.searchBox.showHiddenResources) {
            features.push(this.translate.instant('search.configuration.search-box.show-hidden-resources.toggle-label'));
          }
          if (config.searchBox.semanticReranking) {
            features.push(this.translate.instant('search.configuration.search-box.semantic-reranking.toggle-label'));
          }
          if (config.generativeAnswer.preferMarkdown) {
            features.push(
              this.translate.instant('search.configuration.generative-answer.prefer-markdown.toggle-label'),
            );
          }
          if (
            config.generativeAnswer.prompt ||
            config.generativeAnswer.systemPrompt ||
            config.searchBox.rephrasePrompt
          ) {
            features.push(this.translate.instant('search.configuration.generative-answer.prompt.toggle-label'));
          }
          if (config.generativeAnswer.limitTokenConsumption && config.generativeAnswer.tokenConsumptionLimit) {
            features.push(this.translate.instant('search.configuration.generative-answer.limit-token.toggle-label'));
          }
          if (config.searchBox.limitParagraphs && !!config.searchBox.paragraphsLimit) {
            features.push(this.translate.instant('search.configuration.search-box.limit-paragraphs.toggle-label'));
          }
          if (config.generativeAnswer.askSpecificResource && config.generativeAnswer.specificResourceSlug) {
            features.push(this.translate.instant('search.configuration.generative-answer.ask-resource.toggle-label'));
          }
          const ragStrategiesList: string[] = [];
          const ragStrategies = config.generativeAnswer.ragStrategies;
          if (ragStrategies.includeTextualHierarchy) {
            ragStrategiesList.push(
              this.translate.instant(
                'search.configuration.generative-answer.rag-strategies.textual-hierarchy.toggle-label',
              ),
            );
          }
          if (ragStrategies.includeParagraphImages) {
            ragStrategiesList.push(
              this.translate.instant(
                'search.configuration.generative-answer.rag-strategies.paragraph-images.toggle-label',
              ),
            );
          }
          if (ragStrategies.includePageImages) {
            ragStrategiesList.push(
              this.translate.instant('search.configuration.generative-answer.rag-strategies.page-images.toggle-label'),
            );
          }
          if (ragStrategies.metadatasRagStrategy && ragStrategies.metadatas) {
            ragStrategiesList.push(
              this.translate.instant('search.configuration.generative-answer.rag-strategies.metadatas.toggle-label'),
            );
          }
          if (ragStrategies.graphRagStrategy && ragStrategies.graph) {
            ragStrategiesList.push(
              this.translate.instant('search.configuration.generative-answer.rag-strategies.graph.toggle-label'),
            );
          }
          if (ragStrategies.includeNeighbouringParagraphs) {
            ragStrategiesList.push(
              this.translate.instant(
                'search.configuration.generative-answer.rag-strategies.neighbouring-paragraphs.toggle-label',
              ),
            );
          }
          if (ragStrategies.fieldsAsContext && ragStrategies.fieldIds) {
            ragStrategiesList.push(
              this.translate.instant(
                'search.configuration.generative-answer.rag-strategies.specific-fields.toggle-label',
              ),
            );
          }
          if (ragStrategies.conversationalRagStrategy) {
            ragStrategiesList.push(
              this.translate.instant(
                'search.configuration.generative-answer.rag-strategies.conversational.toggle-label',
              ),
            );
          }
          return {
            vectorset: config.searchBox.vectorset,
            features,
            ragStrategies: ragStrategiesList,
          };
        }),
      ),
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
          const options: RequestConfigAndQueries[] = this.getRequestConfigList(configurations, defaultGenerativeModel);
          return this.ragLabService.generate(options, 'rag');
        }),
      )
      .subscribe();
  }

  downloadCsv() {
    forkJoin([this.searchConfigurations.pipe(take(1)), this.defaultGenerativeModel.pipe(take(1))])
      .pipe(
        map(([configurations, defaultGenerativeModel]) =>
          this.ragLabService.downloadRagLabCsv(
            configurations.map((config) => ({
              configId: config.id,
              generativeModel: config.generativeAnswer.generativeModel || defaultGenerativeModel,
            })),
          ),
        ),
      )
      .subscribe();
  }

  private getRequestConfigList(
    configurations: Widget.SearchConfiguration[],
    defaultGenerativeModel: string,
  ): RequestConfigAndQueries[] {
    return this.selectedConfigs
      .map((configId) => {
        const searchConfig = configurations.find((conf) => conf.id === configId);
        if (!searchConfig) {
          return null;
        }
        let queries: string[] = this.queries;
        if (searchConfig.searchBox.prependTheQuery && searchConfig.searchBox.queryPrepend) {
          queries = this.queries.map((query) => `${searchConfig.searchBox.queryPrepend} ${query}`);
        }

        const requestConfig: RequestConfigAndQueries = {
          searchConfigId: configId,
          queries,
          ...getChatOptions(searchConfig, defaultGenerativeModel),
        };
        return requestConfig;
      })
      .filter((config) => !!config);
  }
}
