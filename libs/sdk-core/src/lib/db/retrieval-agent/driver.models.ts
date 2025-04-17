export interface IDriver {
  id: string;
  provider: 'brave' | 'cypher' | 'nucliadb' | 'perplexity' | 'tavily' | 'sql' | 'mcp';
  name: string;
  config: BraveConfig | CypherConfig | NucliaDBConfig | PerplexityConfig | TavilyConfig | SqlConfig | McpConfig;
}

export type Driver =
  | BraveDriver
  | CypherDriver
  | NucliaDBDriver
  | PerplexityDriver
  | TavilyDriver
  | SqlDriver
  | McpDriver;

export interface BraveDriver extends IDriver {
  provider: 'brave';
  config: BraveConfig;
}
export interface CypherDriver extends IDriver {
  provider: 'cypher';
  config: CypherConfig;
}
export interface NucliaDBDriver extends IDriver {
  provider: 'nucliadb';
  config: NucliaDBConfig;
}
export interface PerplexityDriver extends IDriver {
  provider: 'perplexity';
  config: PerplexityConfig;
}
export interface TavilyDriver extends IDriver {
  provider: 'tavily';
  config: TavilyConfig;
}
export interface SqlDriver extends IDriver {
  provider: 'sql';
  config: SqlConfig;
}
export interface McpDriver extends IDriver {
  provider: 'mcp';
  config: McpConfig;
}

export interface InternetConfig {
  key: string;
}

export interface BraveConfig extends InternetConfig {
  endpoint?: string;
}

export interface CypherConfig {
  username: string;
  password: string;
  url: string;
  timeout: number;
  enhanced_schema: boolean;
  database: string;
}

export interface NucliaDBConfig {
  url: string;
  manager: string;
  key: string;
  filters: string[];
  description: string;
  kbid: string;
}

export type PerplexityConfig = InternetConfig;
export type TavilyConfig = InternetConfig;

export interface SqlConfig {
  dsn: string;
  sql_schema: string;
}

export interface McpConfig {
  key: string;
  uri: string;
  headers: unknown;
  timeout: number;
  sse_read_timeout: number;
}
