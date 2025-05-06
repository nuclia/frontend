import { map, Observable } from 'rxjs';
import { InviteKbData, WritableKnowledgeBox } from '../kb';
import { ExtractedDataTypes } from '../resource';
import { Driver, DriverCreation, ProviderType } from './driver.models';
import {
  ContextAgent,
  ContextAgentCreation,
  IRetrievalAgent,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
  Rule,
  SessionList,
  SessionProperties,
} from './retrieval-agent.models';
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
   * @param provider Optional parameter allowing to filter the drivers to get only the ones corresponding to the given provider type
   */
  getDrivers(provider?: ProviderType): Observable<Driver[]> {
    return this.nuclia.rest.get<{ config: Driver }[]>(`${this.path}/drivers`).pipe(
      map((list) => {
        const drivers = list.map((item) => item.config);
        return provider ? drivers.filter((driver) => driver.provider === provider) : drivers;
      }),
    );
  }

  /**
   * Add driver to the Retrieval Agent
   * @param driver BraveDriver | CypherDriver | NucliaDBDriver | PerplexityDriver | TavilyDriver | SqlDriver | McpDriver
   */
  addDriver(driver: DriverCreation): Observable<void> {
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
    return this.nuclia.rest
      .get<{ rules: (Rule | string)[] }>(`${this.path}/rules`)
      .pipe(map((response) => response.rules));
  }

  /**
   * Set the list of rules of the Retrieval Agent
   * @param rules List of rules to set
   */
  setRules(rules: string[]): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/rules`, { rules });
  }

  /**
   * Get the list of preprocess agents from the Retrieval Agent.
   * @returns the list of preprocess agents
   */
  getPreprocess(): Observable<PreprocessAgent[]> {
    return this.nuclia.rest.get<PreprocessAgent[]>(`${this.path}/preprocess`);
  }

  /**
   * Add a preprocess agent to the Retrieval Agent.
   * @param agent data representing the preprocess agent to add
   */
  addPreprocess(agent: PreprocessAgentCreation): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/preprocess`, agent);
  }

  /**
   * Edit an existing preprocess agent.
   * @param agent Modified preprocess agent to be saved.
   */
  patchPreprocess(agent: PreprocessAgent): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/preprocess/${agent.id}`, agent);
  }

  /**
   * Delete a preprocess agent from the Retrieval Agent.
   * @param agentId Identifier of the preprocess agent to delete
   */
  deletePreprocess(agentId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/preprocess/${agentId}`);
  }

  /**
   * Get the list of context agents from the Retrieval Agent.
   * @returns The list of context agents
   */
  getContext(): Observable<ContextAgent[]> {
    return this.nuclia.rest.get<ContextAgent[]>(`${this.path}/context`);
  }

  /**
   * Add a context agent to the Retrieval Agent.
   * @param agent data representing the context agent to add
   */
  addContext(agent: ContextAgentCreation): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/context`, agent);
  }

  /**
   * Edit an existing context agent.
   * @param agent Modified context agent to be saved
   */
  patchContext(agent: ContextAgent): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/context/${agent.id}`, agent);
  }

  /**
   * Delete a context agent from the Retrieval Agent.
   * @param agentId Identifier of the agent to delete.
   */
  deleteContext(agentId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/context/${agentId}`);
  }

  /**
   * Get the list of postprocess agents from the Retrieval Agent.
   * @returns The list of postprocess agents
   */
  getPostprocess(): Observable<PostprocessAgent[]> {
    return this.nuclia.rest.get<PostprocessAgent[]>(`${this.path}/postprocess`);
  }

  /**
   * Add a postprocess agent to the Retrieval Agent.
   * @param agent data representing the postprocess agent to add
   */
  addPostprocess(agent: PostprocessAgentCreation): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/postprocess`, agent);
  }

  /**
   * Edit an existing postprocess agent.
   * @param agent Modified postprocess agent to be saved
   */
  patchPostprocess(agent: PostprocessAgent): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/postprocess/${agent.id}`, agent);
  }

  /**
   * Delete a postprocess agent from the Retrieval Agent.
   * @param agentId Identifier of the agent to delete
   */
  deletePostprocess(agentId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/postprocess/${agentId}`);
  }
}
