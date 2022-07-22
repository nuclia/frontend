import { Injectable } from '@angular/core';
import { StateService } from '@flaps/core';
import { filter, map } from 'rxjs';

export interface PlanParameter {
  key: string;
}

export interface Plan {
  monthly: number;
  annual: number;
  parameters: { [key: string]: { value: string; overspend?: string } };
}

export const PLAN_PARAMETERS = [
  ['ml_characters', 'docs_no_media', 'media', 'searches', 'train_hours'],
  ['max_storage_bytes', 'max_storage_docs'],
  ['max_size_file_media', 'max_size_file_no_media', 'multiple_kb', 'parallel_processing'],
];

export const BASIC_PLAN: Plan = {
  monthly: 0,
  annual: 0,
  parameters: {
    ml_characters: { value: '300.000' },
    docs_no_media: { value: '100' },
    media: { value: '2 h' },
    searches: { value: '5.000' },
    max_storage_bytes: { value: '300 Mb' },
    max_storage_docs: { value: '500' },
    max_size_file_media: { value: '100 Mb' },
    max_size_file_no_media: { value: '3 Mb' },
  },
};

export const TEAM_PLAN: Plan = {
  monthly: 36,
  annual: 360,
  parameters: {
    ml_characters: { value: '3M', overspend: '+ 6€ / 1M char' },
    docs_no_media: { value: '1.000', overspend: '+ 0.014€ /doc' },
    media: { value: '10 h', overspend: '+ 0.002€ /sec' },
    searches: { value: '100.000', overspend: '+ 1€/month / Gb' },
    train_hours: { value: '1 h', overspend: '+ 1€/month / 1.000 docs' },
    max_storage_bytes: { value: '10 Gb', overspend: '+ 1€ / 1.000 queries' },
    max_storage_docs: { value: '2.000', overspend: '+ 1€ /h' },
    max_size_file_media: { value: '500 Mb' },
    max_size_file_no_media: { value: '20 Mb' },
    multiple_kb: { value: 'True' },
    parallel_processing: { value: 'True' },
  },
};

@Injectable({ providedIn: 'root' })
export class BillingService {
  type = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.type),
  );
  constructor(private stateService: StateService) {}
}
