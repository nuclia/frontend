import { Observable } from 'rxjs';
import { ResourceProperties } from '../db.models';
import { IKnowledgeBoxBase, IKnowledgeBoxItem, InviteKbData, IWritableKnowledgeBox, ResourcePagination } from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Driver, DriverCreation, InternetProviderType, ProviderType } from './driver.models';
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

  getDrivers(provider?: ProviderType): Observable<Driver[]>;
  addDriver(driver: DriverCreation): Observable<void>;
  patchDriver(driver: Driver): Observable<void>;
  deleteDriver(driverId: string): Observable<void>;

  getRules(): Observable<(Rule | string)[]>;
  setRules(rules: string[]): Observable<void>;

  getPreprocess(): Observable<PreprocessAgent[]>;
  addPreprocess(agent: PreprocessAgentCreation): Observable<void>;
  patchPreprocess(agent: PreprocessAgent): Observable<void>;
  deletePreprocess(agentId: string): Observable<void>;

  getContext(): Observable<ContextAgent[]>;
  addContext(agent: ContextAgentCreation): Observable<void>;
  patchContext(agent: ContextAgent): Observable<void>;
  deleteContext(agentId: string): Observable<void>;

  getPostprocess(): Observable<PostprocessAgent[]>;
  addPostprocess(agent: PostprocessAgentCreation): Observable<void>;
  patchPostprocess(agent: PostprocessAgent): Observable<void>;
  deletePostprocess(agentId: string): Observable<void>;
}

export interface Rule {
  prompt: string;
}

export type PreprocessModule = 'historical' | 'rephrase' | 'conditional';
export type ContextModule =
  | InternetProviderType
  | 'sql'
  | 'mcp'
  | 'cypher'
  | 'ask'
  | 'conditional'
  | 'restricted'
  | 'sparql';
export type PostprocessModule = 'summarize' | 'validation' | 'restart' | 'remi' | 'external' | 'conditional';

export interface BaseAgent {
  id: string;
  rules: string[] | null;
  title?: string;
  model?: string;
  validate_model?: string;
  summarize_model?: string;
}

export interface PreprocessAgent extends BaseAgent {
  module: PreprocessModule;
}
export interface ContextAgent extends BaseAgent {
  module: ContextModule;
}
export interface PostprocessAgent extends BaseAgent {
  module: PostprocessModule;
}
export type PreprocessAgentCreation = HistoricalAgentCreation | RephraseAgentCreation;
export type ContextAgentCreation =
  | SqlAgentCreation
  | TavilyAgentCreation
  | PerplexityAgentCreation
  | McpAgentCreation
  | BraveAgentCreation
  | CypherAgentCreation
  | AskAgentCreation
  | ConditionalAgentCreation
  | RestrictedAgentCreation
  | GoogleAgentCreation
  | SparkleAgentCreation;
export type PostprocessAgentCreation =
  | SummarizeAgentCreation
  | ValidationAgentCreation
  | RestartAgentCreation
  | RemiAgentCreation
  | ExternalAgentCreation;

export interface HistoricalAgentCreation {
  module: 'historical';
  all: boolean;
}
export interface RephraseAgentCreation {
  module: 'rephrase';
  kb: string;
  rules: string[];
  rids?: string[];
  labels?: string[];
  synonyms?: boolean;
  extend?: boolean;
  session_info?: boolean;
  history?: boolean;
  model?: string;
}

export interface SqlAgentCreation {
  module: 'sql';
  source: string;
  description?: string | null;
  sqlschema?: string | null;
  retries?: number;
  ignore_tables?: string[];
  include_tables?: string[];
  sample_rows_in_table_info?: number;
  indexes_in_table_info?: boolean;
  custom_table_info?: { [property: string]: unknown };
  view_support?: boolean;
  max_string_length?: number;
  lazy_table_reflection?: boolean;
  conversion_model?: string;
}

export interface TavilyAgentCreation {
  module: 'tavily';
}

export interface PerplexityAgentCreation {
  module: 'perplexity';
  domain: string[];
  top_k: number;
  related_questions: boolean;
  images: boolean;
}

export interface BraveAgentCreation {
  module: 'brave';
  domain: string | null;
  country: string | null;
}

export interface McpAgentCreation {
  module: 'mcp';
}

export interface CypherAgentCreation {
  module: 'cypher';
  source: string;
  exclude_types?: string[];
  include_types?: string[];
  allow_dangerous_requests?: boolean;
  top_k?: number;
  model?: string;
}

export interface AskAgentCreation {
  module: 'ask';
  sources: string[];
  fallback?: ContextAgent;
  pre_queries?: string[];
  filters?: string[];
  security_groups?: string[];
  rephrase_semantic_custom_prompt?: string;
  rephrase_lexical_custom_prompt?: string;
  keyword_custom_prompt?: string;
  visual_enable_prompt?: string;
  date_range_enabled?: boolean;
  before?: number;
  after?: number;
  extra_fields?: string[];
  full_resource?: boolean;
  vllm?: boolean;
  query_entities?: { name: string; type?: string; subtype?: string }[];
  retrieve_related?: string;
  configuration_model?: string;
  configuration_json_model?: string;
}

export interface ConditionalAgentCreation {
  module: 'conditional';
  then: BaseAgent[];
  else_?: BaseAgent[];
  prompt?: string;
  has_keywords?: string[];
  similarity?: string[];
  on?: 'QUESTION' | 'ANSWER' | 'CONTEXT';
  model?: string;
}

export interface RestrictedAgentCreation {
  module: 'restricted';
  code: string;
}

export interface GoogleAgentCreation {
  module: 'google';
  gen_model_id?: string;
}

export interface SparkleAgentCreation {
  module: 'sparql';
}

export interface SummarizeAgentCreation {
  module: 'summarize';
  prompt?: string;
  model?: string;
  images?: boolean;
}
export interface ValidationAgentCreation {
  module: 'validation';
  then?: PostprocessAgentCreation[];
  else_?: PostprocessAgentCreation[];
}
export interface RestartAgentCreation {
  module: 'restart';
  prompt: string;
  model: string;
  retries?: number;
}
export interface RemiAgentCreation {
  module: 'remi';
}
export interface ExternalAgentCreation {
  module: 'external';
}

export interface HistoricalAgent extends PreprocessAgent, HistoricalAgentCreation {
  module: 'historical';
}
export interface RephraseAgent extends PreprocessAgent, RephraseAgentCreation {
  module: 'rephrase';
  rules: string[];
}
export interface SqlAgent extends ContextAgent, SqlAgentCreation {
  module: 'sql';
}
export interface TavilyAgent extends ContextAgent, TavilyAgentCreation {
  module: 'tavily';
}
export interface PerplexityAgent extends ContextAgent, PerplexityAgentCreation {
  module: 'perplexity';
}
export interface McpAgent extends ContextAgent, McpAgentCreation {
  module: 'mcp';
}
export interface BraveAgent extends ContextAgent, BraveAgentCreation {
  module: 'brave';
}
export interface CypherAgent extends ContextAgent, CypherAgentCreation {
  module: 'cypher';
}
export interface AskAgent extends ContextAgent, AskAgentCreation {
  module: 'ask';
}
export interface ConditionalAgent extends ContextAgent, ConditionalAgentCreation {
  module: 'conditional';
}
export interface RestrictedAgent extends ContextAgent, RestrictedAgentCreation {
  module: 'restricted';
}
export interface GoogleAgent extends ContextAgent, GoogleAgentCreation {
  module: 'google';
}
export interface SparkleAgent extends ContextAgent, SparkleAgentCreation {
  module: 'sparql';
}
export interface SummarizeAgent extends PostprocessAgent, SummarizeAgentCreation {
  module: 'summarize';
}
export interface ValidationAgent extends PostprocessAgent, ValidationAgentCreation {
  module: 'validation';
}
export interface RestartAgent extends PostprocessAgent, RestartAgentCreation {
  module: 'restart';
  model: string;
}
export interface RemiAgent extends PostprocessAgent, RemiAgentCreation {
  module: 'remi';
}
export interface ExternalAgent extends PostprocessAgent, ExternalAgentCreation {
  module: 'external';
}
