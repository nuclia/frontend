export interface RemiScore {
  answer_relevance: { score: number; reason: string };
  context_relevance: number[];
  groundedness: number[];
}

export interface RemiQueryResponseItem {
  id: string;
  question: string;
  answer: string;
  remi: RemiScore;
}

export interface RemiQueryResponseContextDetails extends RemiQueryResponseItem {
  context: { text: string; text_block_id: string }[];
}

export interface RemiQueryResponse {
  data: RemiQueryResponseItem[];
}

export interface RemiQueryCriteria {
  context_relevance: {
    value: number;
    operation: 'gt' | 'lt' | 'eq';
    aggregation: 'average' | 'min' | 'max';
  };
  month: string;
}
