import type { FilterExpression } from '../search';

// ---------------------------------------------------------------------------
// Agentic config models
// Source: nucliadb_agentic_api/src/nucliadb_agentic_api/models.py
// ---------------------------------------------------------------------------

export interface AgenticRephraseConfig {
  ask_to?: string;
  prompt?: string;
  model?: string;
}

export type AgenticSmartAgentMode = 'reactive' | 'plan_execute';

export interface AgenticSmartAgentModels {
  context_validation?: string;
  planner?: string;
  executor?: string;
}

export interface AgenticSmartAgentConfig {
  mode?: AgenticSmartAgentMode;
  extra_prompt?: string;
  models?: AgenticSmartAgentModels;
  /** IDs of sources (defined via the sources API) used by this smart agent. */
  sources?: string[];
}

export interface AgenticSummarizeConfig {
  user_prompt?: string;
  system_prompt?: string;
  conversational?: boolean;
  model?: string;
}

export interface AgenticConfig {
  title?: string;
  rephrase?: AgenticRephraseConfig;
  smart_agent?: AgenticSmartAgentConfig;
  summarize?: AgenticSummarizeConfig;
}

export type AgenticConfigs = { [id: string]: AgenticConfig };

// ---------------------------------------------------------------------------
// Source models (referenced by agentic configs)
// ---------------------------------------------------------------------------

export interface NucliaDBSource {
  type: 'nucliadb';
  description?: string;
  filter_expression?: FilterExpression;
  labels?: string[];
  resource_filters?: string[];
}

export interface PerplexitySource {
  type: 'perplexity';
  description?: string;
  enabled_domains?: string[];
}

export type GoogleTimeRange = 'past_day' | 'past_week' | 'past_month' | 'past_year';

export interface GoogleSource {
  type: 'google';
  description?: string;
  time_range?: GoogleTimeRange;
  exclude_domains?: string[];
}

export interface MCPSource {
  type: 'mcp';
  description?: string;
  uri: string;
  headers?: { [key: string]: string };
  tool_choice_model?: string;
  valid_headers?: string[];
}

export interface SyncSource {
  type: 'sync';
  source_id?: string;
  description?: string;
  connection?: string;
  params?: { [key: string]: unknown };
}

export type AgenticSource = NucliaDBSource | PerplexitySource | GoogleSource | MCPSource | SyncSource;

export type AgenticSources = { [id: string]: AgenticSource };
