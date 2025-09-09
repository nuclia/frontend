import type { EntityPosition, Relation } from '@nuclia/core';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';

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

export interface NerNode extends SimulationNodeDatum {
  id: string;
  ner: string;
  family: string;
  relevance: number;
  radius: number;
  color: string;
}

export interface NerLink extends SimulationLinkDatum<NerNode> {
  fromGroup?: string;
  toGroup?: string;
  relevance: number;
  label?: string;
}
