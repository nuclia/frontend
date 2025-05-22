import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { InteractionOperation } from '@nuclia/core';
import { map, switchMap, take, tap } from 'rxjs';
import { runTest, stopTest } from '../../workflow.state';

@Injectable({
  providedIn: 'root',
})
export class TestPanelService {
  private sdk = inject(SDKService);

  private currentSessionId?: string;

  runTest(question: string) {
    // update the state
    runTest(question);
    // Create the session
    const smallHash = (Math.random() + 1).toString(36).substring(7);
    // TODO: reuse session if one exists
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) =>
          arag
            .createSession({
              name: question,
              slug: `test-session-${smallHash}`,
              data: '',
              summary: `Testing retrieval agent ${arag.title}.`,
              format: 'PLAIN',
            })
            .pipe(
              switchMap((session) => {
                console.debug(`Session created:`, session);
                this.currentSessionId = session.uuid;
                // Open the websocket connection and send the question
                return arag
                  .listenSessionInteractions(session.uuid)
                  .pipe(tap(() => arag.interactWithSession(session.uuid, question, InteractionOperation.question)));
              }),
            ),
        ),
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
