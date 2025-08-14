import { Observable } from 'rxjs';
import { IErrorResponse } from '../../models';
import { ResourceProperties } from '../db.models';
import { IKnowledgeBoxBase, IKnowledgeBoxItem, InviteKbData, IWritableKnowledgeBox, ResourcePagination } from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Driver, DriverCreation } from './driver.models';
import { AragAnswer } from './interactions.models';
import {
  AragModule,
  ContextModule,
  GenerationModule,
  PostprocessModule,
  PreprocessModule,
  ProviderType,
} from './retrieval-agent.types';
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
  pagination: SessionPagination;
}

export interface SessionCreationResponse {
  uuid: string;
  elapsed: number;
  seqid: number;
}

export interface SessionCreation {
  slug: string;
  name: string;
  summary: string;
  data: string;
  format: 'PLAIN' | 'HTML' | 'RST' | 'MARKDOWN' | 'JSON' | 'KEEP_MARKDOWN' | 'JSONL' | 'PLAIN_BLANKLINE_SPLIT';
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
  listSessions(page?: number, size?: number): Observable<SessionList>;
  createSession(session: SessionCreation): Observable<SessionCreationResponse>;
  interact(
    sessionId: string,
    question: string,
    method: 'POST' | 'WS',
  ): Observable<{ type: 'answer'; answer: AragAnswer } | IErrorResponse>;
  stopInteraction(sessionId: string): void;

  inviteToAgent(data: InviteKbData): Observable<void>;

  getDrivers(provider?: ProviderType): Observable<Driver[]>;
  addDriver(driver: DriverCreation): Observable<void>;
  patchDriver(driver: Driver): Observable<void>;
  deleteDriver(driverId: string): Observable<void>;

  getRules(): Observable<(Rule | string)[]>;
  setRules(rules: string[]): Observable<void>;

  getPreprocess(): Observable<PreprocessAgent[]>;
  addPreprocess(agent: PreprocessAgentCreation): Observable<{ id: string }>;
  patchPreprocess(agent: PreprocessAgent): Observable<void>;
  deletePreprocess(agentId: string): Observable<void>;

  getContext(): Observable<ContextAgent[]>;
  addContext(agent: ContextAgentCreation): Observable<{ id: string }>;
  patchContext(agent: ContextAgent): Observable<void>;
  deleteContext(agentId: string): Observable<void>;

  getGeneration(): Observable<GenerationAgent[]>;
  addGeneration(agent: GenerationAgentCreation): Observable<{ id: string }>;
  patchGeneration(agent: GenerationAgent): Observable<void>;
  deleteGeneration(agentId: string): Observable<void>;

  getPostprocess(): Observable<PostprocessAgent[]>;
  addPostprocess(agent: PostprocessAgentCreation): Observable<{ id: string }>;
  patchPostprocess(agent: PostprocessAgent): Observable<void>;
  deletePostprocess(agentId: string): Observable<void>;
}

export interface Rule {
  prompt: string;
}

export interface BaseAgent {
  module: AragModule;
  id?: string;
  rules?: string[] | null;
  title?: string;
  model?: string;
  validate_model?: string;
}
// Base agents without ids (not stored yet or stored as a child)
export interface BasePreprocessAgent extends BaseAgent {
  module: PreprocessModule;
}
export interface BaseContextAgent extends BaseAgent {
  module: ContextModule;
}
export interface BaseGenerationAgent extends BaseAgent {
  module: GenerationModule;
}
export interface BasePostprocessAgent extends BaseAgent {
  module: PostprocessModule;
}

// Agents with ids (stored)
export interface PreprocessAgent extends BaseAgent {
  id: string;
  module: PreprocessModule;
}
export interface ContextAgent extends BaseAgent {
  id: string;
  module: ContextModule;
}
export interface GenerationAgent extends BaseAgent {
  id: string;
  module: GenerationModule;
}
export interface PostprocessAgent extends BaseAgent {
  id: string;
  module: PostprocessModule;
}
export type PreprocessAgentCreation = HistoricalAgentCreation | RephraseAgentCreation | PreprocessAliniaCreation;
export type ContextAgentCreation =
  | SqlAgentCreation
  | TavilyAgentCreation
  | PerplexityAgentCreation
  | BraveAgentCreation
  | GoogleAgentCreation
  | McpAgentCreation
  | CypherAgentCreation
  | AskAgentCreation
  | ContextConditionalAgentCreation
  | RestrictedAgentCreation
  | SparqlAgentCreation;
export type GenerationAgentCreation = SummarizeAgentCreation | GenerateAgentCreation;
export type PostprocessAgentCreation =
  | RestartAgentCreation
  | RemiAgentCreation
  | ExternalAgentCreation
  | PostprocessAliniaCreation;

export interface HistoricalAgentCreation {
  module: 'historical';
  all: boolean;
}
export interface RephraseAgentCreation {
  module: 'rephrase';
  kb: string;
  rids?: string[];
  labels?: string[];
  synonyms?: boolean;
  extend?: boolean;
  session_info?: boolean;
  history?: boolean;
  model?: string;
  split_question?: boolean;
}

export interface SqlAgentCreation {
  module: 'sql';
  source: string;
  description?: string | null;
  sqlschema?: string | null;
  retries?: number;
  ignore_tables: string[];
  include_tables: string[];
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
  source: string;
}

export interface PerplexityAgentCreation {
  module: 'perplexity';
  source: string;
  domain: string[];
  top_k: number;
  related_questions: boolean;
  images: boolean;
}

export interface BraveAgentCreation {
  module: 'brave';
  source: string;
  domain: string | null;
  country: string | null;
}

export interface McpAgentCreation {
  module: 'mcp';
  source: string;
  transport: 'SSE' | 'STDIO';
  fallback?: BaseContextAgent | null;
  summarize_model?: string;
  tool_choice_model?: string;
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
  fallback?: BaseContextAgent | null;
  pre_queries?: string[];
  // TODO: provide model to Ramon and he will update it
  filters?: string[];
  security_groups?: string[];
  rephrase_semantic_custom_prompt?: string;
  rephrase_lexical_custom_prompt?: string;
  keywords_custom_prompt?: string;
  visual_enable_prompt?: string;
  date_range_enabled?: boolean;
  before?: number;
  after?: number;
  extra_fields: string[];
  full_resource: boolean;
  vllm: boolean;
  // for knowledge graph search, to be further discussed later
  query_entities?: { name: string; type?: string; subtype?: string }[];
  retrieve_related?: string;
  configuration_model?: string;
  configuration_json_model?: string;
  ai_parameter_search?: boolean;
}

export interface BaseConditionalAgentCreation {
  prompt?: string;
  then: (PreprocessAgent | ContextAgent | PostprocessAgent)[];
  else_: (PreprocessAgent | ContextAgent | PostprocessAgent)[];
}
export interface PreConditionalAgentCreation extends BaseConditionalAgentCreation {
  module: 'pre_conditional';
  then: PreprocessAgent[];
  else_: PreprocessAgent[];
}
export interface ContextConditionalAgentCreation extends BaseConditionalAgentCreation {
  module: 'context_conditional';
  then: ContextAgent[];
  else_: ContextAgent[];
}
export interface PostConditionalAgentCreation extends BaseConditionalAgentCreation {
  module: 'post_conditional';
  then: PostprocessAgent[];
  else_: PostprocessAgent[];
}

export interface RestrictedAgentCreation {
  module: 'restricted';
  code: string;
}

export interface GoogleAgentCreation {
  module: 'google';
  source: string;
  gen_model_id?: string;
}

export interface SparqlAgentCreation {
  module: 'sparql';
}

export interface SummarizeAgentCreation {
  module: 'summarize';
  prompt?: string;
  model?: string;
  images?: boolean;
}
export interface GenerateAgentCreation {
  module: 'generate';
  prompt?: string;
  model?: string;
  images?: boolean;
  generate_image?: boolean;
}
export interface RestartAgentCreation {
  module: 'restart';
  prompt: string;
  model: string;
  retries?: number;
}
export interface RemiAgentCreation {
  module: 'remi';
  then?: PostprocessAgentCreation[];
  else_?: PostprocessAgentCreation[];
}
export interface ExternalAgentCreation {
  module: 'external';
  url: string;
  prompt?: string;
  method?: 'POST' | 'GET' | 'PATCH';
  description?: string;
  call_schema?: unknown;
  call_obj?: unknown;
  headers?: { [name: string]: string };
  model?: string;
  context: boolean;
}

export type GuardrailsPreconfig = 'INAPPROPRIATE' | 'COMPLIANCE' | 'FINANCIAL_COMPLIANT' | 'CUSTOM';
export interface BaseAliniaAgentCreation {
  preconfig: GuardrailsPreconfig;
  metadata: {
    user_id: string | number | null;
    environment: string | null;
  } | null;
  detection_config: object | null;
}

export interface PreprocessAliniaCreation extends BaseAliniaAgentCreation {
  module: 'preprocess_alinia';
  preconfig: 'INAPPROPRIATE' | 'CUSTOM';
}
export interface PostprocessAliniaCreation extends BaseAliniaAgentCreation {
  module: 'postprocess_alinia';
  preconfig: GuardrailsPreconfig;
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
export interface PreConditionalAgent extends PreprocessAgent, PreConditionalAgentCreation {
  module: 'pre_conditional';
}
export interface ContextConditionalAgent extends ContextAgent, ContextConditionalAgentCreation {
  module: 'context_conditional';
}
export interface PostConditionalAgent extends PostprocessAgent, PostConditionalAgentCreation {
  module: 'post_conditional';
}
export interface RestrictedAgent extends ContextAgent, RestrictedAgentCreation {
  module: 'restricted';
}
export interface GoogleAgent extends ContextAgent, GoogleAgentCreation {
  module: 'google';
}
export interface SparkleAgent extends ContextAgent, SparqlAgentCreation {
  module: 'sparql';
}
export interface GenerateAgent extends GenerationAgent, GenerateAgentCreation {
  module: 'generate';
}
export interface SummarizeAgent extends GenerationAgent, SummarizeAgentCreation {
  module: 'summarize';
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
export interface PreprocessAliniaAgent extends PreprocessAgent, PreprocessAliniaCreation {
  module: 'preprocess_alinia';
}
export interface PostprocessAliniaAgent extends PostprocessAgent, PostprocessAliniaCreation {
  module: 'postprocess_alinia';
}
