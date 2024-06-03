import { Injectable } from '@angular/core';
import {
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  DEFAULT_RESULT_DISPLAY_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  SearchConfiguration,
} from '@flaps/common';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetService {
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
}
