import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Account, Ask, RetrievalAgent, WritableKnowledgeBox } from '@nuclia/core';
import { combineLatest, map, Observable, shareReplay, startWith, switchMap, take, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ChatAdviceResponse,
  ChatMessage,
  MessageSegment,
  NdJsonItem,
  PageEntry,
  RouteContext,
} from './chat-advice.models';
import {
  ANSWER_JSON_SCHEMA,
  EXPLANATION_JSON_SCHEMA,
  EXPLANATION_SYSTEM_PROMPT,
  LINK_INJECTION_PROMPT_PREFIX,
} from './chat-advice.config';

@Injectable({ providedIn: 'root' })
export class ChatAdviceService {
  private http = inject(HttpClient);
  private sdk = inject(SDKService);

  private readonly advisorKbAskUrl =
    'https://europe-1.rag.progress.cloud/api/v1/kb/df8b4c24-2807-4888-ad6c-ae97357a638b/ask';
  private readonly advisorKbPredictUrl =
    'https://europe-1.rag.progress.cloud/api/v1/kb/df8b4c24-2807-4888-ad6c-ae97357a638b/predict/chat';

  private readonly pages$ = this.http.get<PageEntry[]>('assets/chat/pages.json').pipe(
    catchError(() => throwError(() => new Error('chat-advice.error'))),
    shareReplay(1),
  );

  private readonly routeContext$ = combineLatest([
    this.sdk.currentAccount.pipe(startWith(null as Account | null)),
    this.sdk.currentKb.pipe(startWith(null as WritableKnowledgeBox | null)),
    this.sdk.currentArag.pipe(startWith(null as RetrievalAgent | null)),
  ]).pipe(
    map(([account, currentKb, currentArag]) => this.getRouteContext(account, currentKb, currentArag)),
    shareReplay(1),
  );

  ask(userMessage: string, previousMessages: ChatMessage[]): Observable<ChatMessage> {
    return combineLatest([this.pages$, this.routeContext$]).pipe(
      take(1),
      switchMap(([pages, routeContext]) => {
        const routeMap = this.buildRouteMap(pages, routeContext);
        const pagesJson = JSON.stringify(pages);
        const chatHistory = previousMessages.map((message) => ({
          author: message.role === 'user' ? Ask.Author.USER : Ask.Author.NUCLIA,
          text: message.content,
        }));

        // Step 1: RAG call — get a plain prose explanation from the KB documentation.
        // extra_context provides the navigation doc so the model can name pages correctly.
        // answer_json_schema ensures reliable extraction (proven NDJSON format).
        return this.http
          .post(
            this.advisorKbAskUrl,
            {
              query: userMessage,
              chat_history: chatHistory,
              extra_context: [pagesJson],
              prompt: { system: EXPLANATION_SYSTEM_PROMPT },
              answer_json_schema: EXPLANATION_JSON_SCHEMA,
              synchronous: true,
            },
            { responseType: 'text' },
          )
          .pipe(
            map((rawText) => this.extractExplanation(rawText)),
            // Step 2: Pure LLM call — inject [page:ID] links. No retrieval, just nav doc + explanation.
            switchMap((explanation) =>
              this.http
                .post(
                  this.advisorKbPredictUrl,
                  {
                    question: `User question: "${userMessage}"\n\nExplanation to enrich with links:\n${explanation}`,
                    user_id: Ask.Author.USER,
                    system: LINK_INJECTION_PROMPT_PREFIX + pagesJson,
                    json_schema: ANSWER_JSON_SCHEMA,
                  },
                  { responseType: 'text' },
                )
                .pipe(
                  map((rawText) => this.extractPredictResponse(rawText)),
                  map((response) => ({
                    role: 'assistant' as const,
                    content: response.answer,
                    segments: this.parseSegments(response.answer, response.pages, routeMap),
                  })),
                ),
            ),
            catchError((error) => throwError(() => this.normalizeError(error))),
          );
      }),
      catchError((error) => throwError(() => this.normalizeError(error))),
    );
  }

  private getRouteContext(
    account: Account | null,
    currentKb: WritableKnowledgeBox | null,
    currentArag: RetrievalAgent | null,
  ): RouteContext {
    const isKbActuallyArag =
      !!currentKb && !!currentArag && (currentKb.id === currentArag.id || currentKb.slug === currentArag.slug);

    return {
      account: account?.slug,
      zone: isKbActuallyArag ? currentArag?.zone : currentKb?.zone || currentArag?.zone,
      kb: isKbActuallyArag ? undefined : currentKb?.slug,
      agent: currentArag?.slug,
    };
  }

  private buildRouteMap(pages: PageEntry[], routeContext: RouteContext): Record<string, string> {
    const routeMap = pages.reduce(
      (map, page) => {
        const resolved = this.resolveRoute(page.route, routeContext);
        if (resolved) map[page.id] = resolved;
        return map;
      },
      {} as Record<string, string>,
    );

    // Cross-context fallbacks: when the AI picks a kb-* page in an agent context (or vice versa),
    // fall back to the sibling by swapping the prefix. E.g. agent-widgets → kb-widgets.
    // Also handles kb-sync which has no agent equivalent — falls back to account-kbs.
    const EXTRA_FALLBACKS: Record<string, string> = { 'kb-sync': 'account-kbs' };

    for (const id of Object.keys(routeMap)) {
      const sibling = id.startsWith('kb-')
        ? id.replace('kb-', 'agent-')
        : id.startsWith('agent-')
          ? id.replace('agent-', 'kb-')
          : null;
      if (sibling && !routeMap[sibling]) routeMap[sibling] = routeMap[id];
    }

    for (const [id, fallbackId] of Object.entries(EXTRA_FALLBACKS)) {
      if (!routeMap[id] && routeMap[fallbackId]) routeMap[id] = routeMap[fallbackId];
    }

    return routeMap;
  }

  private resolveRoute(route: string, routeContext: RouteContext): string | undefined {
    const replacements: Record<string, string | undefined> = {
      ':account': routeContext.account,
      ':zone': routeContext.zone,
      ':kb': routeContext.kb,
      ':agent': routeContext.agent,
    };

    const resolvedRoute = Object.entries(replacements).reduce(
      (currentRoute, [token, value]) => (value ? currentRoute.replaceAll(token, value) : currentRoute),
      route,
    );

    return /:[a-z]+/i.test(resolvedRoute) ? undefined : resolvedRoute;
  }

  // Step 1 parser: extract explanation from /ask NDJSON with answer_json_schema.
  // Format: {"item": {"type": "answer_json", "object": {"explanation": "..."}}}
  private extractExplanation(rawText: string): string {
    const lines = rawText.split('\n').filter((line) => line.trim().length > 0);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as NdJsonItem;
        if (parsed?.item?.type === 'answer_json') {
          const obj = parsed.item.object as { explanation?: string };
          if (typeof obj?.explanation === 'string' && obj.explanation.trim()) {
            return obj.explanation.trim();
          }
        }
      } catch {
        // skip unparseable lines
      }
    }

    return 'Not enough data to answer this.';
  }

  // Step 2 parser: extract structured response from /predict/chat NDJSON.
  // Format: {"chunk": {"type": "object", "object": {...}}}
  private extractPredictResponse(rawText: string): ChatAdviceResponse {
    const lines = rawText.split('\n').filter((line) => line.trim().length > 0);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as NdJsonItem;
        if (parsed?.chunk?.type === 'object' && this.isChatAdviceResponse(parsed.chunk.object)) {
          return parsed.chunk.object;
        }
      } catch {
        // skip unparseable lines
      }
    }

    throw new Error('chat-advice.error');
  }

  private isChatAdviceResponse(response: unknown): response is ChatAdviceResponse {
    return (
      !!response &&
      typeof response === 'object' &&
      typeof (response as ChatAdviceResponse).answer === 'string' &&
      Array.isArray((response as ChatAdviceResponse).pages)
    );
  }

  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error('chat-advice.error');
  }

  private parseSegments(
    answer: string,
    pages: { id: string; title: string }[],
    routeMap: Record<string, string>,
  ): MessageSegment[] {
    // Normalize markdown-style links [Title](page:ID) → [page:ID] so both formats work.
    const normalized = answer.replace(/\[[^\]]*\]\(page:([^)]+)\)/g, '[page:$1]');

    return normalized
      .split(/\[page:([^\]]+)\]/)
      .map((part, index) => {
        if (index % 2 === 0) {
          return { type: 'text' as const, content: part };
        }

        const pageId = part;
        const route = routeMap[pageId];
        const pageRef = pages.find((page) => page.id === pageId);

        if (!route || !pageRef) {
          return { type: 'text' as const, content: pageRef?.title ?? pageId };
        }

        return { type: 'link' as const, content: pageRef.title, route };
      })
      .filter((segment) => segment.content.length > 0);
  }
}
