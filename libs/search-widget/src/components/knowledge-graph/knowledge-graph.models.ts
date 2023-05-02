import type { EntityPosition, Relation } from '@nuclia/core';

export interface NerFamily {
  id: string;
  color: string;
  label: string;
}

export interface PositionWithRelevance extends EntityPosition {
  relevance?: number;
}
export interface RelationWithRelevance extends Relation {
  relevance?: number;
}

export interface NerNode {
  id: string;
  ner: string;
  family: string;
  relevance: number;
}

export interface NerLink {
  source?: string;
  target?: string;
  fromGroup?: string;
  relevance: number;
  label?: string;
}
