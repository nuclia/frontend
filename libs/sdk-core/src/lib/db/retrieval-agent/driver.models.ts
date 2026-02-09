import { FilterExpression } from '../search';
import { ProviderType } from './retrieval-agent.types';

export interface IDriver {
  /**
   * Driver identifier, to be used in path URLs (endpoints)
   */
  id: string;
  /**
   * Driver configuration identifier, to be used in agent configuration
   */
  identifier: string;
  provider: ProviderType;
  name: string;
  config:
    | BraveConfig
    | CypherConfig
    | NucliaDBConfig
    | PerplexityConfig
    | TavilyConfig
    | GoogleConfig
    | SqlConfig
    | McpSseConfig
    | McpStdioConfig
    | McpHttpConfig;
}

export type DriverCreation = Omit<IDriver, 'id'>;

export type Driver =
  | BraveDriver
  | CypherDriver
  | NucliaDBDriver
  | PerplexityDriver
  | TavilyDriver
  | GoogleDriver
  | SqlDriver
  | McpSseDriver
  | McpStdioDriver
  | McpHttpDriver
  | AliniaDriver;
export type InternetDriver = BraveDriver | PerplexityDriver | TavilyDriver | GoogleDriver;

export interface BraveDriver extends IDriver {
  provider: 'brave';
  config: BraveConfig;
}
export interface GoogleDriver extends IDriver {
  provider: 'google';
  config: GoogleConfig;
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
export interface McpHttpDriver extends IDriver {
  provider: 'mcphttp';
  config: McpHttpConfig;
}
export interface AliniaDriver extends IDriver {
  provider: 'alinia';
  config: AliniaConfig;
}

export interface InternetConfig {
  key: string;
}

export interface BraveConfig extends InternetConfig {
  endpoint?: string;
}
export interface GoogleConfig {
  vertexai?: boolean;
  api_key?: string;
  credentials?: string;
  project?: string;
  location?: string;
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
  filters: string[];
  filter_expression?: FilterExpression;
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
export interface McpHttpConfig {}
export interface AliniaConfig {
  key: string;
}
