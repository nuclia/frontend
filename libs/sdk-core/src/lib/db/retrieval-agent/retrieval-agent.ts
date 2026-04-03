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
  OAuthCredentials,
} from './interactions.models';
import {
  ARAGSchemas,
  ContextAgent,
  ContextAgentCreation,
  DownloadOptions,
  DownloadStatus,
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
  Workflow,
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
  private oauthCredentials: OAuthCredentials = {};

  /**
   * The Retrieval Agent path on the regional API.
   */
  override get path(): string {
    return `/agent/${this.id}`;
  }

  /**
   * The Retrieval Agent fullpath on the regional API.
   */
  override get fullpath(): string {
    return `${this.nuclia.regionalBackend}/v1/agent/${this.id}`;
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
    workflowId = 'default',
    method: 'POST' | 'WS' = 'WS',
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    switch (method) {
      case 'POST':
        return this._interactThroughPost(sessionId, question, workflowId, headers);
      case 'WS':
        return this._interactThroughWs(sessionId, question, workflowId, headers);
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
    workflowId: string,
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    const answerSubject = new Subject<AragResponse | IErrorResponse>();
    this.wsOpeningCount = 0;
    this.openWebSocket(sessionId, question, workflowId, answerSubject, undefined, headers);

    return answerSubject.asObservable();
  }

  private openWebSocket(
    sessionId: string,
    question: string,
    workflowId: string,
    answerSubject: Subject<AragResponse | IErrorResponse>,
    fromCursor?: number,
    headers?: { [key: string]: string },
  ) {
    let lastMessage: AragAnswer | undefined;
    this.getWsUrl(sessionId, workflowId, fromCursor).subscribe({
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
            } else if (lastMessage.feedback?.module === 'oauth') {
              const feedback = lastMessage.feedback;
              if (feedback.question === 'Get credentials') {
                const syncConfigIds = Object.keys(feedback.get_credentials || {});
                const existingCredentials = Object.fromEntries(
                  Object.entries(this.oauthCredentials || {}).filter(([key]) => syncConfigIds.includes(key)),
                );
                ws.send(
                  JSON.stringify({
                    request_id: feedback.request_id,
                    response: JSON.stringify({ existing_credentials: existingCredentials }),
                  }),
                );
              } else if (feedback.question === 'Send credentials') {
                this.oauthCredentials = { ...this.oauthCredentials, ...(feedback.credentials || {}) };
                ws.send(
                  JSON.stringify({
                    request_id: feedback.request_id,
                    response: JSON.stringify({ existing_credentials: feedback.credentials }),
                  }),
                );
              }
            } else if (lastMessage.oauth) {
              window.open(lastMessage.oauth.oauth_url, 'blank', 'noreferrer');
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
              this.openWebSocket(sessionId, question, workflowId, answerSubject, lastSeqId + 1, headers);
            } else if (this.wsOpeningCount < 2) {
              // if we got no message, we retry only 3 times
              this.wsOpeningCount++;
              this.openWebSocket(sessionId, question, workflowId, answerSubject, undefined, headers);
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
   * @param workflowId Workflow identifier
   * @returns
   */
  private _interactThroughPost(
    sessionId: string,
    question: string,
    workflowId: string,
    headers?: { [key: string]: string },
  ): Observable<AragResponse | IErrorResponse> {
    let fullPath = this.getInteractionPath(sessionId);
    fullPath += fullPath.includes('?') ? '&' : '?' + `workflow_id=${workflowId}`;
    let nextIndex = 0;
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
          const items: AragAnswer[] = rows.slice(nextIndex).reduce((list, row) => {
            previous += row;
            try {
              const obj = JSON.parse(previous) as AragAnswer;
              list.push(obj);
              previous = '';
            } catch (e) {
              // block is not complete yet
            }
            return list;
          }, [] as AragAnswer[]);

          if (items.length > 0) {
            nextIndex += items.length;
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
  private getWsUrl(sessionId: string, workflowId: string, fromCursor?: number) {
    const path = this.getWsPath(sessionId);
    return (
      this.nuclia.options.accountId
        ? this.getTempToken({ agent_session: sessionId }, true)
        : this.getAgentTempToken(sessionId)
    ).pipe(
      map((token) => {
        const wsUrl = this.nuclia.rest.getWsUrl(path, token);
        const queryParams = new URLSearchParams();
        queryParams.set('workflow_id', workflowId);
        if (typeof fromCursor === 'number') {
          queryParams.set('from_cursor', fromCursor.toString());
        }
        return `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;
      }),
    );
  }
  getAgentTempToken(agent_session: string, ttl?: number): Observable<string> {
    return this.nuclia.rest
      .post<{ token: string }>('/ephemeral_token', { agent_session, ttl })
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
   * Get the list of rules of a workflow
   * @param workflowId
   */
  getRules(workflowId = 'default'): Observable<(Memory.Rule | string)[]> {
    return this.nuclia.rest
      .get<{ rules: (Memory.Rule | string)[] }>(`${this.path}/workflow/${workflowId}/rules`)
      .pipe(map((response) => response.rules));
  }

  /**
   * Set the list of rules of a workflow
   * @param rules List of rules to set
   * @param workflowId
   */
  setRules(rules: string[], workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.post(`${this.path}/workflow/${workflowId}/rules`, { rules });
  }

  /**
   * Get the list of preprocess agents from a workflow.
   * @param workflowId
   * @returns the list of preprocess agents
   */
  getPreprocess(workflowId = 'default'): Observable<PreprocessAgent[]> {
    return this.nuclia.rest.get<PreprocessAgent[]>(`${this.path}/workflow/${workflowId}/preprocess`);
  }

  /**
   * Add a preprocess agent to a workflow.
   * @param agent data representing the preprocess agent to add
   * @param workflowId
   * @returns An observable providing the created agent id.
   */
  addPreprocess(agent: PreprocessAgentCreation, workflowId = 'default'): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/workflow/${workflowId}/preprocess`, agent);
  }

  /**
   * Edit an existing preprocess agent.
   * @param agent Modified preprocess agent to be saved.
   * @param workflowId
   */
  patchPreprocess(agent: PreprocessAgent, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/workflow/${workflowId}/preprocess/${agent.id}`, agent);
  }

  /**
   * Delete a preprocess agent from a workflow.
   * @param agentId Identifier of the preprocess agent to delete
   * @param workflowId
   */
  deletePreprocess(agentId: string, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/workflow/${workflowId}/preprocess/${agentId}`);
  }

  /**
   * Get the list of context agents from a workflow.
   * @param workflowId
   * @returns The list of context agents
   */
  getContext(workflowId = 'default'): Observable<ContextAgent[]> {
    return this.nuclia.rest.get<ContextAgent[]>(`${this.path}/workflow/${workflowId}/context`);
  }

  /**
   * Add a context agent to a workflow.
   * @param agent data representing the context agent to add
   * @param workflowId
   * @returns An observable providing the created agent id.
   */
  addContext(agent: ContextAgentCreation, workflowId = 'default'): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/workflow/${workflowId}/context`, agent);
  }

  /**
   * Edit an existing context agent.
   * @param agent Modified context agent to be saved
   * @param workflowId
   */
  patchContext(agent: ContextAgent, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/workflow/${workflowId}/context/${agent.id}`, agent);
  }

  /**
   * Delete a context agent from a workflow.
   * @param agentId Identifier of the agent to delete.
   * @param workflowId
   */
  deleteContext(agentId: string, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/workflow/${workflowId}/context/${agentId}`);
  }

  /**
   * Get the list of generation agents from a workflow.
   * @param workflowId
   * @returns The list of generation agents
   */
  getGeneration(workflowId = 'default'): Observable<GenerationAgent[]> {
    return this.nuclia.rest.get<GenerationAgent[]>(`${this.path}/workflow/${workflowId}/generation`);
  }

  /**
   * Add a generation agent to a workflow.
   * @param agent data representing the generation agent to add.
   * @param workflowId
   * @returns An observable providing the created agent id.
   */
  addGeneration(agent: GenerationAgentCreation, workflowId = 'default'): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/workflow/${workflowId}/generation`, agent);
  }

  /**
   * Edit an existing generation agent.
   * @param agent Modified generation agent to be saved
   * @param workflowId
   */
  patchGeneration(agent: GenerationAgent, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/workflow/${workflowId}/generation/${agent.id}`, agent);
  }

  /**
   * Delete a generation agent from a workflow.
   * @param agentId Identifier of the agent to delete
   * @param workflowId
   */
  deleteGeneration(agentId: string, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/workflow/${workflowId}/generation/${agentId}`);
  }

  /**
   * Get the list of postprocess agents from a workflow.
   * @param workflowId
   * @returns The list of postprocess agents
   */
  getPostprocess(workflowId = 'default'): Observable<PostprocessAgent[]> {
    return this.nuclia.rest.get<PostprocessAgent[]>(`${this.path}/workflow/${workflowId}/postprocess`);
  }

  /**
   * Add a postprocess agent to a workflow.
   * @param agent data representing the postprocess agent to add
   * @param workflowId
   * @returns An observable providing the created agent id.
   */
  addPostprocess(agent: PostprocessAgentCreation, workflowId = 'default'): Observable<{ id: string }> {
    return this.nuclia.rest.post<{ id: string }>(`${this.path}/workflow/${workflowId}/postprocess`, agent);
  }

  /**
   * Edit an existing postprocess agent.
   * @param agent Modified postprocess agent to be saved
   * @param workflowId
   */
  patchPostprocess(agent: PostprocessAgent, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.patch(`${this.path}/workflow/${workflowId}/postprocess/${agent.id}`, agent);
  }

  /**
   * Delete a postprocess agent from a workflow.
   * @param agentId Identifier of the agent to delete
   * @param workflowId
   */
  deletePostprocess(agentId: string, workflowId = 'default'): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/workflow/${workflowId}/postprocess/${agentId}`);
  }

  /**
   * Get the agents and drivers schemas
   */
  getSchemas(): Observable<ARAGSchemas> {
    return this.nuclia.rest.get<ARAGSchemas>(`${this.path}/schema`);
  }

  /** @deprecated
   * Use getSchemas
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

  /**
   * Request the download of activity data
   * @param options Download options
   */
  requestActivityDownload(options: DownloadOptions): Observable<DownloadStatus> {
    const { format, ...rest } = options;
    const headers = { accept: options.format === 'csv' ? 'text/csv' : ' application/x-ndjson' };
    return this.nuclia.rest.post<DownloadStatus>(`${this.path}/audit/interactions/download`, rest, headers);
  }

  /**
   * Get the status of all downloads
   */
  getDownloads(): Observable<DownloadStatus[]> {
    return this.nuclia.rest.get<DownloadStatus[]>(`${this.path}/audit/download_requests`);
  }

  /**
   * Get the status of a download
   * @param requestId
   */
  getDownload(requestId: string): Observable<DownloadStatus> {
    return this.nuclia.rest.get<DownloadStatus>(`${this.path}/audit/download_request/${requestId}/status`);
  }

  /**
   * Get the list of workflows
   */
  getWorkflows(): Observable<Workflow[]> {
    return this.nuclia.rest.get<Workflow[]>(`${this.path}/workflows`);
  }

  /**
   * Create a new workflow
   */
  createWorkflow(data: Workflow): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/workflows`, data);
  }

  /**
   * Edit an existing workflow
   */
  patchWorkflow(workflowId: string, data: Omit<Workflow, 'id'>): Observable<void> {
    return this.nuclia.rest.patch<void>(`${this.path}/workflow/${workflowId}`, data);
  }
}
