import { inject, Injectable } from '@angular/core';
import {
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  DEFAULT_RESULT_DISPLAY_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  getAskToResource,
  getFeatures,
  getFilters,
  getMaxTokens,
  getNotEnoughDataMessage,
  getPlaceholder,
  getPreselectedFilters,
  getPrompt,
  getRagStrategies,
  SearchConfiguration,
} from './search-widget.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { forkJoin, map, Observable, take } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetService {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private backendConfig = inject(BackendConfigurationService);
  private sanitizer = inject(DomSanitizer);

  getStandardSearchConfiguration(): SearchConfiguration {
    return {
      searchBox: {
        ...DEFAULT_SEARCH_BOX_CONFIG,
        suggestions: true,
        autocompleteFromNERs: true,
      },
      generativeAnswer: {
        ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
        generateAnswer: true,
      },
      resultDisplay: {
        ...DEFAULT_RESULT_DISPLAY_CONFIG,
        displayResults: true,
        relations: true,
      },
    };
  }

  generateSnippet(currentConfig: SearchConfiguration): Observable<{ preview: SafeHtml; snippet: string }> {
    this.deletePreview();

    const features = getFeatures(currentConfig);
    const placeholder = getPlaceholder(currentConfig.searchBox);
    const prompt = getPrompt(currentConfig.generativeAnswer);
    const filters = getFilters(currentConfig.searchBox);
    const preselectedFilters = getPreselectedFilters(currentConfig.searchBox);
    const { ragProperties, ragImagesProperties } = getRagStrategies(currentConfig.generativeAnswer.ragStrategies);
    const notEnoughDataMessage = getNotEnoughDataMessage(currentConfig.generativeAnswer);
    const askToResource = getAskToResource(currentConfig.generativeAnswer);
    const maxTokens = getMaxTokens(currentConfig.generativeAnswer);
    const generativeModel = `\n  generativemodel="${currentConfig.generativeAnswer.generativeModel}"`;

    return forkJoin([this.sdk.currentKb.pipe(take(1)), this.sdk.currentAccount.pipe(take(1))]).pipe(
      map(([kb, account]) => {
        const zone = this.sdk.nuclia.options.standalone
          ? `standalone="true"`
          : `zone="${this.sdk.nuclia.options.zone}"`;
        const apiKey = `apikey="YOUR_API_TOKEN"`;
        const privateDetails =
          kb.state === 'PRIVATE'
            ? `\n  state="${kb.state}"\n  account="${account.id}"\n  kbslug="${kb.slug}"\n  ${apiKey}`
            : '';
        const backend = this.sdk.nuclia.options.standalone ? `\n  backend="${this.backendConfig.getAPIURL()}"` : '';

        let baseSnippet = `<nuclia-search-bar\n  knowledgebox="${kb.id}"`;
        baseSnippet += `\n  ${zone}${features}${prompt}${ragProperties}${ragImagesProperties}${placeholder}${notEnoughDataMessage}${askToResource}${maxTokens}${generativeModel}${filters}${preselectedFilters}${privateDetails}${backend}`;
        baseSnippet += `></nuclia-search-bar>\n<nuclia-search-results></nuclia-search-results>`;

        const snippet = `<script src="https://cdn.nuclia.cloud/nuclia-video-widget.umd.js"></script>\n${baseSnippet}`;
        const preview = this.sanitizer.bypassSecurityTrustHtml(
          baseSnippet
            .replace(
              'zone=',
              `client="dashboard" backend="${this.backendConfig.getAPIURL()}" lang="${
                this.translate.currentLang
              }" zone=`,
            )
            .replace('features="', `features="dumpLog,`)
            .replace(apiKey, '')
            .replace('<nuclia-search-results', '<nuclia-search-results scrollableContainerSelector=".preview-content"'),
        );

        return { snippet, preview };
      }),
    );
  }

  private deletePreview() {
    const searchWidgetElement = document.querySelector('nuclia-search') as any;
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchWidgetElement?.$$c?.$destroy === 'function') {
      searchWidgetElement.$$c?.$destroy();
    }
    if (typeof searchBarElement?.$$c?.$destroy === 'function') {
      searchBarElement.$$c?.$destroy();
    }
    if (typeof searchResultsElement?.$$c?.$destroy === 'function') {
      searchResultsElement.$$c?.$destroy();
    }
    searchWidgetElement?.remove();
    searchBarElement?.remove();
    searchResultsElement?.remove();
  }
}
