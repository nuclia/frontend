import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Account, Ask, RetrievalAgent, WritableKnowledgeBox } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
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
  NO_DATA_SENTINEL,
} from './chat-advice.config';

@Injectable({ providedIn: 'root' })
export class ChatAdviceService {
  private http = inject(HttpClient);
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);

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
        const { prefix, hint, pageFilter } = this.getContext(routeContext);
        const routeMap = this.buildRouteMap(pages, routeContext);
        const contextualPagesJson = JSON.stringify(pages.filter(pageFilter));
        const allPagesJson = JSON.stringify(pages);
        const chatHistory = previousMessages.slice(-6).map((message) => ({
          author: message.role === 'user' ? Ask.Author.USER : Ask.Author.NUCLIA,
          text: message.content,
        }));

        return this.http
          .post(
            this.advisorKbAskUrl,
            {
              query: prefix + userMessage,
              chat_history: chatHistory,
              extra_context: [contextualPagesJson],
              prompt: { system: EXPLANATION_SYSTEM_PROMPT + '\n\n' + hint },
              answer_json_schema: EXPLANATION_JSON_SCHEMA,
              synchronous: true,
            },
            { responseType: 'text' },
          )
          .pipe(
            map((rawText) => this.extractExplanation(rawText)),
            switchMap((explanation) =>
              this.http
                .post(
                  this.advisorKbPredictUrl,
                  {
                    question: `User context: ${hint}\n\nUser question: "${userMessage}"\n\nExplanation to enrich with links:\n${explanation}`,
                    user_id: Ask.Author.USER,
                    system: LINK_INJECTION_PROMPT_PREFIX + allPagesJson,
                    json_schema: ANSWER_JSON_SCHEMA,
                  },
                  { responseType: 'text' },
                )
                .pipe(
                  map((rawText) => this.extractPredictResponse(rawText)),
                  map((response) => {
                    const answer =
                      response.answer.trim() === NO_DATA_SENTINEL
                        ? this.translate.instant('chat-advice.no-data')
                        : response.answer;
                    return {
                      role: 'assistant' as const,
                      content: answer,
                      segments: this.parseSegments(answer, response.pages, routeMap),
                    };
                  }),
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

  // Derives query prefix, context hint, and page filter from the current route context.
  private getContext(ctx: RouteContext): {
    prefix: string;
    hint: string;
    pageFilter: (p: PageEntry) => boolean;
  } {
    if (ctx.agent) {
      return {
        prefix: 'Retrieval Agent or general dashboard feature: ',
        hint: 'User is viewing a Retrieval Agent. Prefer page IDs prefixed with "agent-".',
        pageFilter: (p) => !p.id.startsWith('kb-'),
      };
    }
    if (ctx.kb) {
      return {
        prefix: 'Knowledge Box or general dashboard feature: ',
        hint: 'User is viewing a Knowledge Box. Prefer page IDs prefixed with "kb-".',
        pageFilter: (p) => !p.id.startsWith('agent-'),
      };
    }
    return {
      prefix: 'Nuclia dashboard feature: ',
      hint: 'User is on account-level pages. Prefer page IDs prefixed with "account-".',
      pageFilter: () => true,
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

    // kb-sync has no agent sibling — fall back to the account KB list.
    if (!routeMap['kb-sync'] && routeMap['account-kbs']) {
      routeMap['kb-sync'] = routeMap['account-kbs'];
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

  // Shared NDJSON line parser — returns first line where extract() returns non-null.
  private parseNdjson<T>(text: string, extract: (parsed: NdJsonItem) => T | null): T | null {
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const result = extract(JSON.parse(line) as NdJsonItem);
        if (result !== null) return result;
      } catch {
        // skip unparseable lines
      }
    }
    return null;
  }

  private extractExplanation(rawText: string): string {
    return (
      this.parseNdjson(rawText, (p) => {
        if (p?.item?.type !== 'answer_json') return null;
        const explanation = (p.item.object as { explanation?: string })?.explanation?.trim();
        if (!explanation || explanation === NO_DATA_SENTINEL) return null;
        return explanation;
      }) ?? this.translate.instant('chat-advice.no-data')
    );
  }

  private extractPredictResponse(rawText: string): ChatAdviceResponse {
    const result = this.parseNdjson(rawText, (p) =>
      p?.chunk?.type === 'object' && this.isChatAdviceResponse(p.chunk.object) ? p.chunk.object : null,
    );
    if (!result) throw new Error('chat-advice.error');
    return result;
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
    // Normalize [Title](page:ID) markdown links → [page:ID] as a safety net for model format drift.
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
