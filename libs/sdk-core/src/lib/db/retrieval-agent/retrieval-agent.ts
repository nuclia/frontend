import { map, Observable } from 'rxjs';
import { InviteKbData, WritableKnowledgeBox } from '../kb';
import { Driver, DriverCreation, ProviderType } from './driver.models';
import {
  ContextAgent,
  ContextAgentCreation,
  GenerationAgent,
  GenerationAgentCreation,
  InteractionOperation,
  IRetrievalAgent,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
  Rule,
  SessionCreation,
  SessionCreationResponse,
  SessionList,
  SessionPagination,
} from './retrieval-agent.models';
import { Session } from './session';
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
  getSession(sessionId: string): Observable<ISession> {
    return this.nuclia.rest.get<ISession>(`${this.path}/session/${sessionId}`);
  }
  /**
   * List all the sessions stored in the Retrieval Agent.
   * @param page Page index (0 by default)
   * @param size Page size
   * @returns Paginated sessions list
   */
  listSessions(page?: number, size?: number): Observable<SessionList> {
    const params = [page ? `page=${page}` : '', size ? `size=${size}` : ''].filter((p) => p).join('&');
    return this.nuclia.rest
      .get<{
        resources: ISession[];
        pagination: SessionPagination;
      }>(`${this.path}/sessions${params ? '?' + params : ''}`)
      .pipe(
        map((res) => ({
          sessions: res.resources.map((resource) => new Session(this.nuclia, this.id, resource)),
          pagination: res.pagination as SessionPagination,
        })),
      );
  }

  /**
   * Create sessions on the retrieval agent
   * @param session
   * @returns
   */
  createSession(session: SessionCreation): Observable<SessionCreationResponse> {
    return this.nuclia.rest.post<SessionCreationResponse>(`${this.path}/sessions`, session);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private interactionStream?: Observable<any>;

  private getWsPath(sessionId: string): string {
    // FIXME: the endpoint should be without the s, but it raise a 404. with the s we got a 403.
    // return `${this.path}/session/${sessionId}/ws`;
    return `${this.path}/sessions/${sessionId}/ws`;
  }

  /**
   * Open a WebSocket for the session interactions if needed and return the corresponding interaction stream observable.
   * @param sessionId Session identifier
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listenSessionInteractions(sessionId: string): Observable<any> {
    const path = this.getWsPath(sessionId);
    if (!this.interactionStream) {
      this.interactionStream = this.nuclia.rest.openWebSocket(path);
    }
    return this.interactionStream;
  }

  /**
   * Interact with the session by sending a question or quit operation
   * @param sessionId Session identifier
   * @param question Question to send to the agent
   * @param operation Operation: question (0) or quit (1)
   * @returns
   */
  interactWithSession(sessionId: string, question: string, operation: InteractionOperation) {
    const path = this.getWsPath(sessionId);
    if (!this.interactionStream) {
      this.interactionStream = this.nuclia.rest.openWebSocket(path);
    }

    this.nuclia.rest.send(path, {
      question,
      operation,
    });
    if (operation === InteractionOperation.quit) {
      this.nuclia.rest.closeWebSocket(path);
    }
  }

  /**
   * Reset the session interaction.
   */
  resetSessionInteraction(sessionId: string) {
    this.interactWithSession(sessionId, '', InteractionOperation.quit);
    this.interactionStream = undefined;
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
   * @returns An observable providing the created agent id.
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
   * @returns An observable providing the created agent id.
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
   * Get the list of generation agents from the Retrieval Agent.
   * @returns The list of generation agents
   */
  getGeneration(): Observable<GenerationAgent[]> {
    return this.nuclia.rest.get<GenerationAgent[]>(`${this.path}/generation`);
  }

  /**
   * Add a generation agent to the Retrieval Agent.
   * @param agent data representing the generation agent to add.
   * @returns An observable providing the created agent id.
   */
  addGeneration(agent: GenerationAgentCreation): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/generation`, agent);
  }

  /**
   * Edit an existing generation agent.
   * @param agent Modified generation agent to be saved
   */
  patchGeneration(agent: GenerationAgent): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/generation/${agent.id}`, agent);
  }

  /**
   * Delete a generation agent from the Retrieval Agent.
   * @param agentId Identifier off the agent to delete
   */
  deleteGeneration(agentId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/generation/${agentId}`);
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
   * @returns An observable providing the created agent id.
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
