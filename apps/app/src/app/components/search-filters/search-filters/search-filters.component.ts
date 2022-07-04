import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CheckboxGroupItem } from '@flaps/common';
import { StateService } from '@flaps/core';
import { NavigationService } from '../../../services/navigation.service';

export type FilterType = 'tags' | 'documents' | 'origins' | 'results';
export type Order = 'relevance' | 'date';

const PARAM_SEPARATOR = ',';

const ORDERS = [
  {
    label: 'generic.relevance',
    value: 'relevance',
  },
  {
    label: 'generic.creation_date',
    value: 'date',
  },
];
const DEFAULT_ORDER: Order = 'relevance';

@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFiltersComponent implements OnInit {
  orders = ORDERS;
  resultTypes: CheckboxGroupItem[] = EXAMPLE_DATA_1;
  documentTypes: CheckboxGroupItem[] = EXAMPLE_DATA_2;
  origins: CheckboxGroupItem[] = EXAMPLE_DATA_3;

  selectedOrder$ = this.getOrder();
  selectedTags$ = this.getFilter('tags');
  selectedDocumentTypes$ = this.getFilter('documents');
  selectedResultTypes$ = this.getFilter('results');
  selectedOrigins$ = this.getFilter('origins');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private navigation: NavigationService,
  ) {}

  ngOnInit(): void {}

  getOrder(): Observable<string> {
    return this.route.queryParamMap.pipe(
      map((paramMap) => {
        const value = paramMap.get('order');
        return value === null ? DEFAULT_ORDER : value;
      }),
    );
  }

  setOrder(order: string | null): void {
    const params: Params = {};
    params['order'] = order === DEFAULT_ORDER ? null : order;
    this.setParams(params);
  }

  getFilter(filter: FilterType): Observable<string[]> {
    return this.route.queryParamMap.pipe(
      map((paramMap) => {
        const value = paramMap.get(filter);
        return value ? value.split(PARAM_SEPARATOR) : [];
      }),
    );
  }

  setFilters(filterType: FilterType, value: string[] | null): void {
    const params: Params = {};
    params[filterType] = value && value.length > 0 ? value.join(PARAM_SEPARATOR) : value;
    this.setParams(params);
  }

  setParams(params: Params): void {
    /*
    const { account, stash } = this.stateService.getStateData()!;
    const searchRoute = this.navigation.getSearchUrl(account, stash!);
    */
    const searchRoute = '.';
    this.router.navigate([searchRoute], {
      queryParams: params,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}

const EXAMPLE_DATA_1 = [
  {
    label: 'Semantic',
    value: 'semantic',
    helpTips: ['12'],
  },
  {
    label: 'Paragraph',
    value: 'paragraph',
    helpTips: ['6'],
  },
  {
    label: 'Document',
    value: 'document',
    helpTips: ['4'],
  },
];

const EXAMPLE_DATA_2 = [
  {
    label: 'PDF',
    value: 'pdf',
    helpTips: ['12'],
  },
  {
    label: 'Text',
    value: 'text',
    helpTips: ['.doc, .txt', '6'],
  },
  {
    label: 'Vídeo',
    value: 'video',
    helpTips: ['.avi, .mov, .mp4', '4'],
  },
];

const EXAMPLE_DATA_3 = [
  {
    label: 'Drive',
    value: 'drive',
    helpTips: ['8'],
  },
  {
    label: 'Dropbox',
    value: 'dropbox',
    helpTips: ['2'],
  },
  {
    label: 'Other',
    value: 'other',
    helpTips: ['4'],
  },
];
