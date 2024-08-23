import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import { DatedRangeChartData, RangeChartData } from '../charts';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { RemiQueryResponseContextDetails, RemiQueryResponseItem } from './remi.models';

@Injectable({
  providedIn: 'root',
})
export class RemiMetricsService {
  private translate = inject(TranslateService);

  healthCheckData: Observable<RangeChartData[]> = of([
    { category: this.translate.instant('metrics.remi.category-short.answer-relevance'), average: 4.25, min: 4, max: 5 },
    { category: this.translate.instant('metrics.remi.category-short.context-relevance'), average: 2.5, min: 0, max: 5 },
    { category: this.translate.instant('metrics.remi.category-short.groundedness'), average: 5, min: 5, max: 5 },
  ]).pipe(
    map((data) =>
      data.map((item) => ({
        ...item,
        average: (item.average * 100) / 5,
        min: (item.min * 100) / 5,
        max: (item.max * 100) / 5,
      })),
    ),
  );

  missingKnowledgeData: Observable<RemiQueryResponseItem[]> = of([
    {
      id: 'unique_id_1',
      question: 'Who was Hedy Lamarr?',
      answer:
        'Hedy Lamarr was an Austrian-American actress and inventor, known for developing a radio guidance system for Allied torpedoes during World War II.',
      remi: {
        answer_relevance: {
          score: 5,
          reason:
            "The answer is highly relevant, accurately capturing Hedy Lamarr's contributions as both an actress and an inventor.",
        },
        context_relevance: [4, 5],
        groundedness: [5, 5],
      },
    },
    {
      id: 'unique_id_2',
      question: 'What is frequency hopping?',
      answer:
        'Frequency hopping is a method of transmitting radio signals by rapidly switching a carrier among many frequency channels, minimizing the risk of interception and jamming.',
      remi: {
        answer_relevance: {
          score: 4,
          reason:
            'The answer is relevant but could include more details about how frequency hopping is used in modern technology.',
        },
        context_relevance: [3],
        groundedness: [4],
      },
    },
  ]);

  private rawEvolutionData = of([
    {
      timestamp: '2024-08-11T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.5,
          max: 5,
          min: 3,
        },
        {
          name: 'answer_relevance',
          average: 3,
          max: 4,
          min: 2,
        },
        {
          name: 'context_relevance',
          average: 3.2,
          max: 4,
          min: 0,
        },
      ],
    },
    {
      timestamp: '2024-08-12T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.5,
          max: 5,
          min: 3,
        },
        {
          name: 'answer_relevance',
          average: 4,
          max: 4.9,
          min: 2.9,
        },
        {
          name: 'context_relevance',
          average: 3.2,
          max: 4,
          min: 0,
        },
      ],
    },
    {
      timestamp: '2024-08-13T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.5,
          max: 5,
          min: 3,
        },
        {
          name: 'answer_relevance',
          average: 4.2,
          max: 4.9,
          min: 3,
        },
        {
          name: 'context_relevance',
          average: 3.2,
          max: 4,
          min: 0,
        },
      ],
    },
    {
      timestamp: '2024-08-14T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.5,
          max: 5,
          min: 3,
        },
        {
          name: 'answer_relevance',
          average: 4.2,
          max: 4.8,
          min: 3.8,
        },
        {
          name: 'context_relevance',
          average: 3.2,
          max: 4,
          min: 0,
        },
      ],
    },
    {
      timestamp: '2024-08-15T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.5,
          max: 5,
          min: 4,
        },
        {
          name: 'answer_relevance',
          average: 4,
          max: 4.8,
          min: 2,
        },
        {
          name: 'context_relevance',
          average: 3,
          max: 4,
          min: 1,
        },
      ],
    },
    {
      timestamp: '2024-08-16T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 4.9,
          max: 5,
          min: 4,
        },
        {
          name: 'answer_relevance',
          average: 4.3,
          max: 4.8,
          min: 3,
        },
        {
          name: 'context_relevance',
          average: 3,
          max: 4,
          min: 1,
        },
      ],
    },
    {
      timestamp: '2024-08-17T14:00:00.000Z',
      metrics: [
        {
          name: 'groundedness',
          average: 5.0,
          max: 5,
          min: 5,
        },
        {
          name: 'answer_relevance',
          average: 4.5,
          max: 5,
          min: 4,
        },
        {
          name: 'context_relevance',
          average: 3.5,
          max: 5,
          min: 2,
        },
      ],
    },
  ]);
  groundednessEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) =>
      data.map((item) => {
        const groundedness = item.metrics.find((metric) => metric.name === 'groundedness');
        return {
          timestamp: format(new Date(item.timestamp), 'd/MM'),
          min: (groundedness!.min * 100) / 5,
          max: (groundedness!.max * 100) / 5,
          average: (groundedness!.average * 100) / 5,
        };
      }),
    ),
  );
  answerEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) =>
      data.map((item) => {
        const answerRelevance = item.metrics.find((metric) => metric.name === 'answer_relevance');
        return {
          timestamp: format(new Date(item.timestamp), 'd/MM'),
          min: (answerRelevance!.min * 100) / 5,
          max: (answerRelevance!.max * 100) / 5,
          average: (answerRelevance!.average * 100) / 5,
        };
      }),
    ),
  );
  contextEvolution: Observable<DatedRangeChartData[]> = this.rawEvolutionData.pipe(
    map((data) =>
      data.map((item) => {
        const contextRelevance = item.metrics.find((metric) => metric.name === 'context_relevance');
        return {
          timestamp: format(new Date(item.timestamp), 'd/MM'),
          min: (contextRelevance!.min * 100) / 5,
          max: (contextRelevance!.max * 100) / 5,
          average: (contextRelevance!.average * 100) / 5,
        };
      }),
    ),
  );

  getMissingKnowledgeDetails(id: string): Observable<RemiQueryResponseContextDetails> {
    const request =
      id === 'unique_id_1'
        ? of({
            id: 'unique_id_1',
            question: 'Who was Hedy Lamarr?',
            answer:
              'Hedy Lamarr was an Austrian-American actress and inventor, known for developing a radio guidance system for Allied torpedoes during World War II.',
            context: [
              {
                text: 'Hedy Lamarr was more than just a Hollywood star. She co-invented an early technique for spread spectrum communications and frequency hopping, technologies that are now incorporated into modern Wi-Fi and Bluetooth.',
                text_block_id: '57900998c2dc45c19216b157e125b656/t/body--0/2597-3085',
              },
              {
                text: "Lamarr's invention of frequency hopping was a critical contribution to modern wireless communication. She worked with composer George Antheil to create a system that would later be used in secure military communications.",
                text_block_id: '41d67efab57f45d2b616b6fdec6d7032/t/body--0/0-939',
              },
            ],
            remi: {
              answer_relevance: {
                score: 5,
                reason:
                  "The answer is highly relevant, accurately capturing Hedy Lamarr's contributions as both an actress and an inventor.",
              },
              context_relevance: [4, 5],
              groundedness: [5, 5],
            },
          })
        : of({
            id: 'unique_id_2',
            question: 'What is frequency hopping?',
            answer:
              'Frequency hopping is a method of transmitting radio signals by rapidly switching a carrier among many frequency channels, minimizing the risk of interception and jamming.',
            context: [
              {
                text: 'The concept of frequency hopping was revolutionary in the 1940s and laid the groundwork for modern wireless communication technologies, including Wi-Fi and Bluetooth.',
                text_block_id: '167356da54524c039e81685655a32624/t/body--0/4499-5102',
              },
            ],
            remi: {
              answer_relevance: {
                score: 4,
                reason:
                  'The answer is relevant but could include more details about how frequency hopping is used in modern technology.',
              },
              context_relevance: [3],
              groundedness: [4],
            },
          });

    return request.pipe(delay(1000));
  }
}
