import { UsagePoint } from '@nuclia/core';

export const data: UsagePoint[] = [
  {
    timestamp: '2024-03-17T18:00:00',
    metrics: [
      {
        name: 'pre_processing_time',
        value: 9,
        details: [],
      },
      {
        name: 'slow_processing_time',
        value: 0,
        details: [],
      },
      {
        name: 'resources_processed',
        value: 0,
        details: [],
      },
      {
        name: 'bytes_processed',
        value: 0,
        details: [],
      },
      {
        name: 'chars_processed',
        value: 0,
        details: [],
      },
      {
        name: 'media_seconds_processed',
        value: 0,
        details: [],
      },
      {
        name: 'media_files_processed',
        value: 0,
        details: [],
      },
      {
        name: 'pages_processed',
        value: 0,
        details: [],
      },
      {
        name: 'paragraphs_processed',
        value: 0,
        details: [],
      },
      {
        name: 'train_seconds',
        value: 0,
        details: [],
      },
      {
        name: 'searches_performed',
        value: 0,
        details: [],
      },
      {
        name: 'suggestions_performed',
        value: 0,
        details: [],
      },
      {
        name: 'predictions_performed',
        value: 0,
        details: [],
      },
      {
        name: 'docs_no_media',
        value: 0,
        details: [],
      },
      {
        name: 'ai_tokens_used',
        value: 0,
        details: [],
      },
      {
        name: 'nuclia_tokens',
        value: 291,
        details: [
          {
            nuclia_tokens: {
              requests: null,
              input: 12,
              output: 15,
            },
            identifier: {
              type: 'rephrase',
              source: 'predict',
              model: 'chatgpt4',
              version: 'v20240409',
            },
            raw_usage: {
              requests: 3,
              input: 6,
              output: 9,
            },
          },
          {
            nuclia_tokens: {
              requests: null,
              input: 42,
              output: 45,
            },
            identifier: {
              type: 'rephrase',
              source: 'processing',
              model: 'mistral',
              version: 'v20240409',
            },
            raw_usage: {
              requests: 33,
              input: 36,
              output: 39,
            },
          },
          {
            nuclia_tokens: {
              requests: null,
              input: 27,
              output: 30,
            },
            identifier: {
              type: 'rephrase',
              source: 'processing',
              model: 'chatgpt4',
              version: 'v20240409',
            },
            raw_usage: {
              requests: 18,
              input: 21,
              output: 24,
            },
          },
          {
            nuclia_tokens: {
              requests: 63,
              input: null,
              output: null,
            },
            identifier: {
              type: 'searches',
              source: 'predict',
              model: null,
              version: 'v20240409',
            },
            raw_usage: {
              requests: 60,
              input: null,
              output: null,
            },
          },
          {
            nuclia_tokens: {
              requests: 57,
              input: null,
              output: null,
            },
            identifier: {
              type: 'sentence',
              source: 'predict',
              model: 'chatgpt4',
              version: 'v20240409',
            },
            raw_usage: {
              requests: 48,
              input: 51,
              output: 54,
            },
          },
        ],
      },
    ],
  },
];
