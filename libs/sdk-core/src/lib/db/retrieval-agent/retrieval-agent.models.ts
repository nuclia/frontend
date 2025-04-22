import { Observable } from 'rxjs';
import { ResourceProperties } from '../db.models';
import { IKnowledgeBoxBase, IKnowledgeBoxItem, InviteKbData, IWritableKnowledgeBox, ResourcePagination } from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Driver, DriverCreation } from './driver.models';
import { Session } from './session';
import { ISession } from './session.models';

export type IRetrievalAgentBase = IKnowledgeBoxBase;
export type IRetrievalAgentItem = IKnowledgeBoxItem;
export type SessionProperties = ResourceProperties;
export type SessionPagination = ResourcePagination;

export interface RetrievalAgentCreation {
  slug: string;
  title: string;
  mode: 'agent';
}

export interface SessionList {
  sessions: Session[];
  pagignation: SessionPagination;
}

export interface IRetrievalAgent
  extends Omit<
    IWritableKnowledgeBox,
    | 'getEntities'
    | 'getEntitiesGroup'
    | 'getSynonyms'
    | 'getLabels'
    | 'createAgenticRAGPipeline'
    | 'generateRandomQuestionAboutResource'
    | 'setLabelSet'
    | 'deleteLabelSet'
    | 'setSynonyms'
    | 'deleteAllSynonyms'
  > {
  getSession(uuid: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession>;
  getFullSession(uuid: string): Observable<ISession>;
  getSessionBySlug(slug: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession>;
  getFullSessionBySlug(slug: string): Observable<ISession>;
  listSessions(page?: number, size?: number): Observable<SessionList>;
  inviteToAgent(data: InviteKbData): Observable<void>;

  getDrivers(): Observable<Driver[]>;
  addDriver(driver: DriverCreation): Observable<void>;
  patchDriver(driver: Driver): Observable<void>;
  deleteDriver(driverId: string): Observable<void>;

  getRules(): Observable<(Rule | string)[]>;
  setRules(rules: string[]): Observable<void>;
}

export interface Rule {
  prompt: string;
}
