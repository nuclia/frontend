import { Injectable } from '@angular/core';
import { StateService } from '@flaps/core';
import { filter, map } from 'rxjs';

export const FEATURES = [
  { title: 'Document thumnails generation', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Document Indexing', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Maximum file size', basic: 'Up to 10 Mb', pro: 'Up to 120 Mb', business: 'Up to 1.5 Gb' },
  { title: 'Number of knowledge boxes', basic: '1', pro: '3', business: '10' },
  { title: 'Search trend topics', basic: '', pro: 'coming soon', business: 'coming soon' },
  { title: 'Videos and audio indexing', basic: '', pro: 'yes', business: 'yes' },
  { title: 'URL indexing', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Multi-language search', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Ranking tuner', basic: '', pro: '', business: 'yes' },
  { title: 'Usage analytics and retention', basic: '', pro: '', business: '90 days' },
  { title: 'Widget system access', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Typo tolerance search', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'NER Detection', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Indexing booster', basic: '', pro: 'yes', business: 'yes' },
  { title: 'Nuclia widget for internal usage', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Self-hosted API key', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Chrome Extension', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Desktop Application for data ingestion', basic: 'yes', pro: 'yes', business: 'yes' },
  { title: 'Data Anonymization', basic: '', pro: '', business: 'yes' },
];

export const PARAMETERS = [
  {
    type: 'Ingest',
    items: [
      { title: 'Extracted & analized paragraphs', free: '1000 paragraph/month', over: '0.0006€ /paragraph' },
      { title: 'Extracted & analized documents', free: '100 documents/month', over: '0.014€ /document' },
      { title: 'Extracted & analized hours video / audio', free: '2 hours/month', over: '7.20€ /hour' },
    ],
  },
  {
    type: 'Training',
    items: [
      { title: 'Classification', free: '0 hours', over: '3€ /hour' },
      { title: 'Question & answering', free: '0 hours', over: '3€ /hour' },
    ],
  },
  {
    type: 'NucliaDB Hosted',
    items: [
      { title: 'Paragraphs stored', free: '4000 paragraphs/month', over: '0.0002€ /paragraph' },
      { title: 'Searches, suggestions and questions', free: '5000 searches/month *', over: '0.0015€ /search' },
    ],
  },
  {
    type: 'NucliaDB Self-hosted',
    items: [{ title: 'Searches, suggestions and questions', free: '5000 searches/month *', over: '0.0008€ /search' }],
  },
];

@Injectable({ providedIn: 'root' })
export class BillingService {
  type = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.type),
  );
  constructor(private stateService: StateService) {}
}
