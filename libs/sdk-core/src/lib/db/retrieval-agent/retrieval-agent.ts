import { from, map, Observable, Subject, switchMap } from 'rxjs';
import { IErrorResponse } from '../../models';
import { InviteKbData, WritableKnowledgeBox } from '../kb';
import { Driver, DriverCreation } from './driver.models';
import {
  AnswerOperation,
  AragAnswer,
  AragResponse,
  InteractionOperation,
  mapErrorResponseFromAnswer,
} from './interactions.models';
import {
  ARAGSchemas,
  ContextAgent,
  ContextAgentCreation,
  ExportOptions,
  GenerationAgent,
  GenerationAgentCreation,
  ImportOptions,
  IRetrievalAgent,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
  PreprocessAgentCreation,
  SessionCreation,
  SessionCreationResponse,
  SessionList,
  SessionPagination,
} from './retrieval-agent.models';
import { Memory } from './memory.models';
import { ProviderType } from './retrieval-agent.types';
import { Session } from './session';
import { ISession } from './session.models';
import { JSONSchema4 } from 'json-schema';

/**
 * Provides access to all the Retrieval Agent contents and services.
 */
export class RetrievalAgent extends WritableKnowledgeBox implements IRetrievalAgent {
  private wsConnections: { [sessionId: string]: WebSocket } = {};

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

  interact(
    sessionId: string,
    question: string,
    method: 'POST' | 'WS' = 'WS',
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    switch (method) {
      case 'POST':
        return this._interactThroughPost(sessionId, question, headers);
      case 'WS':
        return this._interactThroughWs(sessionId, question, headers);
    }
  }

  stopInteraction(sessionId: string) {
    if (this.wsConnections[sessionId]) {
      this.wsConnections[sessionId].send(JSON.stringify({ question: '', operation: InteractionOperation.quit }));
      this.wsConnections[sessionId].close(1000);
      delete this.wsConnections[sessionId];
    }
  }

  wsOpeningCount = 0;
  private _interactThroughWs(
    sessionId: string,
    question: string,
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    const answerSubject = new Subject<AragResponse | IErrorResponse>();
    this.wsOpeningCount = 0;
    this.openWebSocket(sessionId, question, answerSubject, undefined, headers);

    return answerSubject.asObservable();
  }

  private openWebSocket(
    sessionId: string,
    question: string,
    answerSubject: Subject<AragResponse | IErrorResponse>,
    fromCursor?: number,
    headers?: { [key: string]: string },
  ) {
    let lastMessage: AragAnswer | undefined;
    this.getWsUrl(sessionId, fromCursor).subscribe({
      next: (wsUrl) => {
        const ws = new WebSocket(wsUrl);
        this.wsConnections[sessionId] = ws;
        ws.onopen = () => {
          const message = { question, operation: InteractionOperation.question, headers };
          // and send the question
          ws.send(JSON.stringify(message));
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data) {
            lastMessage = data as AragAnswer;
            if (lastMessage.operation === AnswerOperation.done) {
              ws.close(1000);
              answerSubject.next({ type: 'answer', answer: lastMessage });
            } else if (lastMessage.operation === AnswerOperation.error) {
              ws.close(1000);
              answerSubject.next(mapErrorResponseFromAnswer(lastMessage));
            } else {
              answerSubject.next({ type: 'answer', answer: lastMessage });
            }
          }
        };
        ws.onerror = (error) => {
          answerSubject.next({ type: 'error', status: -1, detail: 'WebSocket error', body: error });
          answerSubject.complete();
        };

        ws.onclose = (event) => {
          // When close status is not a normal one, we check we got all the answers
          if (event.code === 1000 || lastMessage?.operation === AnswerOperation.done) {
            answerSubject.complete();
          } else {
            // If not we reopen a connection from the last seqId
            const lastSeqId = lastMessage?.seqid || null;
            if (lastSeqId !== null) {
              this.openWebSocket(sessionId, question, answerSubject, lastSeqId + 1, headers);
            } else if (this.wsOpeningCount < 2) {
              // if we got no message, we retry only 3 times
              this.wsOpeningCount++;
              this.openWebSocket(sessionId, question, answerSubject, undefined, headers);
            } else {
              answerSubject.next({
                type: 'error',
                status: -1,
                detail: 'WebSocket was closed without returning any answer.',
                body: event,
              });
              answerSubject.complete();
            }
          }
        };
      },
      error: (error) => {
        answerSubject.next({ type: 'error', status: error.status, detail: error.detail, body: error.body });
        answerSubject.complete();
      },
    });
  }

  /**
   * Interact with the session with an HTTP POST request.
   * @param sessionId Session identifier
   * @param question Question to send to the agent
   * @returns
   */
  private _interactThroughPost(
    sessionId: string,
    question: string,
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    const fullPath = this.getInteractionPath(sessionId);
    let lastMessage: AragAnswer | undefined;
    return this.nuclia.rest
      .getStreamedResponse(fullPath, {
        question,
        operation: InteractionOperation.question,
        headers,
      })
      .pipe(
        switchMap(({ data }) => {
          const rows = new TextDecoder()
            .decode(data.buffer)
            .split('\n')
            .filter((d) => d);
          let previous = '';
          const items: AragAnswer[] = rows.reduce((list, row) => {
            previous += row;
            try {
              const obj = JSON.parse(previous) as AragAnswer;
              if (!lastMessage || (lastMessage.seqid && obj.seqid && obj.seqid > lastMessage.seqid)) {
                list.push(obj);
              }
              previous = '';
            } catch (e) {
              // block is not complete yet
            }
            return list;
          }, [] as AragAnswer[]);

          if (items.length > 0) {
            lastMessage = items[items.length - 1];
          }
          return from(
            items.map((item) =>
              item.operation === AnswerOperation.error
                ? mapErrorResponseFromAnswer(item)
                : ({ type: 'answer', answer: item } as AragResponse),
            ),
          );
        }),
      );
  }

  private getInteractionPath(sessionId: string): string {
    return `${this.path}/session/${sessionId}`;
  }
  private getWsPath(sessionId: string): string {
    return `${this.getInteractionPath(sessionId)}/ws`;
  }
  private getWsUrl(sessionId: string, fromCursor?: number) {
    const path = this.getWsPath(sessionId);
    return (
      this.nuclia.options.accountId
        ? this.getTempToken({ agent_session: sessionId }, true)
        : this.getAgentTempToken(sessionId)
    ).pipe(
      map((token) => {
        const wsUrl = this.nuclia.rest.getWsUrl(path, token);
        return typeof fromCursor === 'number'
          ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}from_cursor=${fromCursor}`
          : wsUrl;
      }),
    );
  }
  getAgentTempToken(agent_session: string, ttl?: number): Observable<string> {
    return this.nuclia.rest
      .post<{ token: string }>('/service_account_agent_key', { agent_session, ttl })
      .pipe(map((res) => res.token));
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
  getRules(): Observable<(Memory.Rule | string)[]> {
    return this.nuclia.rest
      .get<{ rules: (Memory.Rule | string)[] }>(`${this.path}/rules`)
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

  /** @deprecated
   * Use getFullSchemas
   */
  getSchemas(): Observable<ARAGSchemas> {
    return this.nuclia.rest.get<ARAGSchemas>(`${this.path}/schema`);
  }

  /**
   * Get the agents and drivers schemas
   */
  getFullSchemas(): Observable<JSONSchema4> {
    return this.nuclia.rest.get<JSONSchema4>(`${this.path}/fullschema`);
  }

  /**
   * Request the export of a Retrieval Agent.
   * @param options Export options
   */
  export(options: ExportOptions): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/export`, options);
  }

  /**
   * Import a Retrieval Agent.
   * @param options Import options
   */
  import(options: ImportOptions): Observable<void> {
    const data = new FormData();
    Object.entries(options).forEach(([key, value]) => {
      const validValue = typeof value === 'boolean' || typeof value === 'number' ? value.toString() : value;
      data.append(key, validValue);
    });
    return this.nuclia.rest.post<void>(`${this.path}/import`, data);
  }
}
