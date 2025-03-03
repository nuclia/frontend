import type { EntityPosition, Relation } from '@nuclia/core';

export interface NerFamily {
  id: string;
  color: string;
  label: string;
}

export interface EntityPositionsWithRelevance {
  [entityId: string]: PositionWithRelevance;
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
  radius: number;
  color: string;
}

interface BaseLink {
  fromGroup?: string;
  toGroup?: string;
  relevance: number;
  label?: string;
}

export interface NerLink extends BaseLink {
  source?: string;
  target?: string;
}

export interface NerLinkHydrated extends BaseLink {
  source: NerNode;
  target: NerNode;
}
