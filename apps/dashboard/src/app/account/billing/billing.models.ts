export type Currency = 'USD' | 'EUR';
export type UsageType =
  | 'qa'
  | 'media'
  | 'searches'
  | 'self-hosted-qa'
  | 'self-hosted-predict'
  | 'self-hosted-processed-paragraphs'
  | 'self-hosted-processed-documents'
  | 'training-hours'
  | 'paragraphs'
  | 'files'; // this last one does not existing in the backend response, we calculate it from paragraphs

export interface Prices {
  recurring: {
    month: { price: number };
    year: { price: number };
  };
  usage: {
    [key in UsageType]: Usage;
  };
}

export interface Usage {
  threshold: number;
  price: number;
}
