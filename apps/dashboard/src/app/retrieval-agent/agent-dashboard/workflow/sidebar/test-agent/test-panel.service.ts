import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { InteractionOperation, RetrievalAgent, Session } from '@nuclia/core';
import { map, Observable, switchMap, take, tap } from 'rxjs';
import { runTest, stopTest } from '../../workflow.state';

const TEST_SESSION_SLUG_PREFIX = 'test-session';

@Injectable({
  providedIn: 'root',
})
export class TestPanelService {
  private sdk = inject(SDKService);

  private currentSessionId?: string;

  getTestSessions(): Observable<Session[]> {
    return this.sdk.currentArag.pipe(
      take(1),
      switchMap((arag) => arag.listSessions(0, 100)),
      map((data) => data.sessions.filter((session) => session.slug?.startsWith(TEST_SESSION_SLUG_PREFIX))),
    );
  }

  runTest(question: string, sessionId: string) {
    // update the state
    runTest(question);
    let sessionRequest: Observable<{ sessionId: string; arag: RetrievalAgent }>;
    if (sessionId === 'new') {
      // Create the session
      const smallHash = (Math.random() + 1).toString(36).substring(7);
      sessionRequest = this.sdk.currentArag.pipe(
        take(1),
        switchMap((arag) =>
          arag
            .createSession({
              name: question,
              slug: `${TEST_SESSION_SLUG_PREFIX}-${smallHash}`,
              data: '',
              summary: `Testing retrieval agent ${arag.title}.`,
              format: 'PLAIN',
            })
            .pipe(map((response) => ({ sessionId: response.uuid, arag }))),
        ),
      );
    } else {
      sessionRequest = this.sdk.currentArag.pipe(
        take(1),
        switchMap((arag) => arag.getSession(sessionId).pipe(map((session) => ({ sessionId: session.id, arag })))),
      );
    }

    sessionRequest
      .pipe(
        switchMap(({ sessionId, arag }) => {
          this.currentSessionId = sessionId;
          // Open the websocket connection and send the question
          return arag
            .listenSessionInteractions(sessionId)
            .pipe(tap(() => arag.interactWithSession(sessionId, question, InteractionOperation.question)));
        }),
      )
      .subscribe({
        next: (data) => {
          // TODO: update the state with the data we get from the session
          console.debug(`Data we get from websocket:`, data);
        },
        error: (error) => {
          console.error(`Error occurred while creating the session`, error);
        },
      });
  }

  stopTest() {
    if (!this.currentSessionId) {
      return;
    }
    const sessionId = this.currentSessionId;
    this.sdk.currentArag
      .pipe(
        take(1),
        map((arag) => arag.resetSessionInteraction(sessionId)),
      )
      .subscribe({
        // Update the state
        next: () => stopTest(),
        error: (error) => {
          console.error(`Error occurred while closing the session interactions`, error);
        },
      });
  }
}
