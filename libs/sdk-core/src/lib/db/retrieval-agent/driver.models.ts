export type InternetProviderType = 'brave' | 'perplexity' | 'tavily' | 'google';
export type ProviderType = InternetProviderType | 'cypher' | 'nucliadb' | 'sql' | 'mcpsse' | 'mcpstdio';

export interface IDriver {
  id: string;
  provider: ProviderType;
  name: string;
  config:
    | BraveConfig
    | CypherConfig
    | NucliaDBConfig
    | PerplexityConfig
    | TavilyConfig
    | SqlConfig
    | McpSseConfig
    | McpStdioConfig;
}

export type DriverCreation = Omit<IDriver, 'id'>;

export type Driver =
  | BraveDriver
  | CypherDriver
  | NucliaDBDriver
  | PerplexityDriver
  | TavilyDriver
  | SqlDriver
  | McpSseDriver;

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
export interface McpSseDriver extends IDriver {
  provider: 'mcpsse';
  config: McpSseConfig;
}
export interface McpStdioDriver extends IDriver {
  provider: 'mcpstdio';
  config: McpStdioConfig;
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
  timeout: number | null;
  enhanced_schema: boolean;
  database: string | null;
  config: { [property: string]: string | number | null };
}

export interface NucliaDBConfig {
  url: string;
  manager: string;
  key?: string;
  description: string;
  kbid: string;
}

export type PerplexityConfig = InternetConfig;
export type TavilyConfig = InternetConfig;

export interface SqlConfig {
  dsn: string;
  sql_schema: string | null;
}

export interface McpSseConfig {
  uri: string;
  key: string | null;
  headers: { [property: string]: string };
  timeout: number;
  sse_read_timeout: number;
}
export interface McpStdioConfig {
  command: string;
  args: string[];
  env: { [property: string]: string };
  cwd?: string;
  encoding?: string;
  encoding_error_handler?: 'strict' | 'ignore' | 'replace';
}
