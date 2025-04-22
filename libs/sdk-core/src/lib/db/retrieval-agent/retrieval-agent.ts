import { map, Observable } from 'rxjs';
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
    return this.nuclia.rest.get<Driver[]>(`${this.path}/drivers`);
  }

  /**
   * Add driver to the Retrieval Agent
   * @param driver BraveDriver | CypherDriver | NucliaDBDriver | PerplexityDriver | TavilyDriver | SqlDriver | McpDriver
   */
  addDriver(driver: Driver): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/drivers`, driver);
  }

  /**
   * Edit driver
   * @param driver BraveDriver | CypherDriver | NucliaDBDriver | PerplexityDriver | TavilyDriver | SqlDriver | McpDriver
   */
  patchDriver(driver: Driver): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/driver/${driver.id}`, driver);
  }

  /**
   * Delete driver
   * @param driverId Identifier of the driver to delete
   */
  deleteDriver(driverId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/driver/${driverId}`);
  }

  /**
   * Get the list of rules of the Retrieval Agent
   */
  getRules(): Observable<(Rule | string)[]> {
    return this.nuclia.rest.get<(Rule | string)[]>(`${this.path}/rules`);
  }

  /**
   * Set the list of rules of the Retrieval Agent
   * @param rules List of rules to set
   */
  setRules(rules: string[]): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/rules`, { rules });
  }
}
