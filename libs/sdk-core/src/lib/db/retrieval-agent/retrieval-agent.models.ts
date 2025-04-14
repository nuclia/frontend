import { Observable } from 'rxjs';
import { ResourceProperties } from '../db.models';
import {
  IKnowledgeBox,
  IKnowledgeBoxBase,
  IKnowledgeBoxItem,
  InviteKbData,
  IWritableKnowledgeBox,
  ResourcePagination,
} from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Session } from './session';
import { ISession } from './session.models';

export type IRetrievalAgentBase = IKnowledgeBoxBase;
export type IRetrievalAgentItem = IKnowledgeBoxItem;
export type SessionProperties = ResourceProperties;
export type SessionPagination = ResourcePagination;

export interface SessionList {
  sessions: Session[];
  pagignation: SessionPagination;
}

export interface IRetrievalAgent
  extends Omit<
    IKnowledgeBox,
    | 'getEntities'
    | 'getEntitiesGroup'
    | 'getSynonyms'
    | 'getLabels'
    | 'createAgenticRAGPipeline'
    | 'generateRandomQuestionAboutResource'
  > {
  getSession(uuid: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession>;
  getFullSession(uuid: string): Observable<ISession>;
  getSessionBySlug(slug: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession>;
  getFullSessionBySlug(slug: string): Observable<ISession>;
  listSessions(page?: number, size?: number): Observable<SessionList>;
}

export interface IWritableRetrievalAgent
  extends Omit<IWritableKnowledgeBox, 'setLabelSet' | 'deleteLabelSet' | 'setSynonyms' | 'deleteAllSynonyms'> {
  createSession(session: ISession, synchronous: boolean): Observable<{ uuid: string }>;
  inviteToAgent(data: InviteKbData): Observable<void>;
}
