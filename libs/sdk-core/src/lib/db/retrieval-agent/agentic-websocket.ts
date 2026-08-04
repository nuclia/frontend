import { Subject } from 'rxjs';
import type { IErrorResponse } from '../../models';
import {
  AnswerOperation,
  AragAnswer,
  AragResponse,
  InteractionRequest,
  mapErrorResponseFromAnswer,
} from './interactions.models';

/**
 * Sets up the onopen / onmessage / onerror / onclose handlers on an already-created WebSocket.
 *
 * Shared by `RetrievalAgent._interactThroughWs()` and `KnowledgeBox.asViaWS()`.
 * Both callers own the Subject and the WebSocket; this function only wires the handlers.
 *
 * @param ws         The WebSocket instance to attach handlers to.
 * @param message    The initial message sent on open.
 * @param subject    The Subject that receives parsed AragAnswer emissions.
 * @param onUnexpectedClose  Called when the socket closes with a non-1000 code before receiving
 *                           a DONE operation. The caller decides whether to reconnect (RetrievalAgent)
 *                           or emit an error and complete (KnowledgeBox).
 */
export function setupAgenticWSHandlers(
  ws: WebSocket,
  message: InteractionRequest,
  subject: Subject<AragResponse | IErrorResponse>,
  onUnexpectedClose?: (event: CloseEvent, lastMessage?: AragAnswer) => void,
  closeOnDone = true,
): void {
  let lastMessage: AragAnswer | undefined;

  ws.onopen = () => {
    ws.send(JSON.stringify(message));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as AragAnswer;
    if (!data) return;
    lastMessage = data;
    if (data.operation === AnswerOperation.done) {
      subject.next({ type: 'answer', answer: data });
      if (closeOnDone) {
        ws.close(1000);
      }
    } else if (data.operation === AnswerOperation.error) {
      ws.close(1000);
      subject.next(mapErrorResponseFromAnswer(data));
    } else {
      subject.next({ type: 'answer', answer: data });
    }
  };

  ws.onerror = (error) => {
    subject.next({ type: 'error', status: -1, detail: 'WebSocket error', body: error });
    subject.complete();
  };

  ws.onclose = (event) => {
    if (event.code === 1000 || lastMessage?.operation === AnswerOperation.done) {
      subject.complete();
    } else if (onUnexpectedClose) {
      onUnexpectedClose(event, lastMessage);
    } else {
      subject.next({ type: 'error', status: -1, detail: 'WebSocket closed unexpectedly', body: event });
      subject.complete();
    }
  };
}
