import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { InviteKbData, WritableKnowledgeBox } from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Driver } from './driver.models';
import { IRetrievalAgent, Rule, SessionList, SessionProperties } from './retrieval-agent.models';
import { ISession } from './session.models';

/**
 * Provides access to all the Retrieval Agent contents and services.
 */
export class RetrievalAgent extends WritableKnowledgeBox implements IRetrievalAgent {
  /**
   * The Retrieval Agent path on the regional API.
   */
  override get path(): string {
    return `/kb/${this.id}/agent`;
  }

  private _drivers = new BehaviorSubject<Driver[]>([
    {
      id: 'brave-driver_2292',
      name: 'Brave driver',
      provider: 'brave',
      config: {
        key: 'brave-key',
      },
    },
    {
      id: 'perplexity-driver_3555',
      name: 'Perplexity driver',
      provider: 'perplexity',
      config: {
        key: 'perplexity-key',
      },
    },
    {
      id: 'tavily-driver_3095',
      name: 'Tavily driver',
      provider: 'tavily',
      config: {
        key: 'tavily-key',
      },
    },
    {
      id: 'sql-driver-1_1cf0',
      name: 'SQL driver 1',
      provider: 'sql',
      config: {
        dsn: 'my-sql-1',
        sql_schema: null,
      },
    },
    {
      id: 'sql-driver-2_2237',
      name: 'SQL driver 2',
      provider: 'sql',
      config: {
        dsn: 'my-sql-2',
        sql_schema: null,
      },
    },
    {
      id: 'cypher-driver_23c9',
      name: 'Cypher driver',
      provider: 'cypher',
      config: {
        username: 'user',
        password: 'pass',
        url: '/cypher/url',
        timeout: 0,
        enhanced_schema: true,
        database: null,
        config: {},
      },
    },
    {
      id: 'mcp-driver_2068',
      name: 'MCP driver',
      provider: 'mcp',
      config: {
        uri: '/mcp/uri',
        key: 'mcp-key',
        timeout: 5,
        sse_read_timeout: 300,
        headers: {},
      },
    },
  ]);
  get drivers() {
    return this._drivers.asObservable();
  }

  /**
   * Retrieves a session from the Retrieval Agent.
   *
   * - `show` defines which properties are returned. Default retrieves only the basic metadata.
   * - `extracted` defines which extracted data are returned.
   *    It is ignored if `ResourceProperties.EXTRACTED` is not in the returned properties.
   *    Default is an empty array.
   *
   * Example:
    ```ts
    nuclia.db
      .getRetrievalAgent()
      .pipe(switchMap((agent) => agent.getSession('09a94719a6444c5a9689394f6ed9baf6')))
      .subscribe((session) => {
        console.log('session', session);
      });
    ```
   */
  getSession(uuid: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession> {
    return this.getResource(uuid, show, extracted);
  }
  /**
   * Retrieves a session from the Retrieval Agent with all its attached metadata and content.
   */
  getFullSession(uuid: string): Observable<ISession> {
    return this.getFullResource(uuid);
  }
  getSessionBySlug(slug: string, show?: SessionProperties[], extracted?: ExtractedDataTypes[]): Observable<ISession> {
    return this.getResourceBySlug(slug, show, extracted);
  }
  getFullSessionBySlug(slug: string): Observable<ISession> {
    return this.getFullResourceBySlug(slug);
  }
  listSessions(page?: number, size?: number): Observable<SessionList> {
    return this.listResources(page, size).pipe(
      map((resourceList) => ({ sessions: resourceList.resources, pagignation: resourceList.pagination })),
    );
  }

  /**
   * Invite a user to the Retrieval Agent.
   * @param data
   * @returns
   */
  inviteToAgent(data: InviteKbData): Observable<void> {
    return this.inviteToKb(data);
  }

  /**
   * Get the list of drivers of the Retrieval Agent
   */
  getDrivers(): Observable<Driver[]> {
    return of(this._drivers.value); //this.nuclia.rest.get<Driver[]>(`${this.path}/drivers`);
  }

  /**
   * Add driver to the Retrieval Agent
   * @param driver BraveDriver | CypherDriver | NucliaDBDriver | PerplexityDriver | TavilyDriver | SqlDriver | McpDriver
   */
  addDriver(driver: Driver): Observable<void> {
    this._drivers.next(this._drivers.value.concat([driver]));
    return of();
    // return this.nuclia.rest.post(`${this.path}/drivers`, driver);
  }

  /**
   * Get the list of rules of the Retrieval Agent
   */
  getRules(): Observable<(Rule | string)[]> {
    return this.nuclia.rest.get<(Rule | string)[]>(`${this.path}/rules`);
  }
}
