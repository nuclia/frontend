import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { cloneDeep } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG, RAG_METADATAS, Widget } from '@nuclia/core';

export interface AdviceInput {
  question: string;
  answer: string;
  context?: string;
  remiScores?: {
    answerRelevance?: number;
    contextRelevance?: number;
    groundedness?: number;
  };
  params?: {
    minScoreSemantic?: number;
    minScoreBm25?: number;
    topK?: number;
    ragStrategies?: string[];
    model?: string;
    filter?: string;
    rephrase?: boolean;
    systemPrompt?: string;
  };
  status?: string;
  userExpectation?: string;
  /** History of exploration rounds — used when re-generating advice after one or more test runs. */
  iterationHistory?: IterationHistoryEntry[];
}

/** One exploration round for the advisor prompt context. */
export interface IterationHistoryEntry {
  round: number;
  paramsDescription: string;
  outcome: 'no_context' | 'no_answer' | 'answer';
  answer?: string;
  remiScore?: number;
  remiAnswerRelevance?: number;
  remiContentRelevance?: number;
  remiGroundedness?: number;
}

type SuggestedAdviceParams = Partial<{
  minScoreSemantic: number;
  minScoreBm25: number;
  topK: number;
  ragStrategies: string[];
  systemPrompt: string;
  rephrase: boolean;
}> & { model?: never };

export interface AdviceResult {
  diagnosis: string;
  suggestions: string[];
  suggestedParams?: SuggestedAdviceParams;
  rawResponse: string;
}

/** View-model for the editable params panel in the exploration modal. */
export interface EditableParams {
  minScoreSemantic: number | null;
  minScoreBm25: number | null;
  topK: number | null;
  neighbouringParagraphs: boolean;
  fullResource: boolean;
  metadatas: boolean;
  graph: boolean;
  rephrase: boolean;
  model: string;
  systemPrompt: string;
}

/**
 * Converts editable exploration params into a Widget.SearchConfiguration that can be saved
 * via SearchWidgetService.saveSearchConfig().
 *
 * Note: minScoreSemantic and minScoreBm25 are KB-level thresholds — they are NOT part of
 * widget configurations and must be applied separately in KB defaults.
 */
export function suggestedParamsToSearchConfig(
  params: EditableParams,
  configId: string,
): Widget.TypedSearchConfiguration {
  const config = cloneDeep(NUCLIA_STANDARD_SEARCH_CONFIG) as Widget.TypedSearchConfiguration;
  config.id = configId;

  if (params.topK !== null) {
    config.searchBox.limitParagraphs = true;
    config.searchBox.paragraphsLimit = params.topK;
  }
  config.searchBox.rephraseQuery = params.rephrase;

  if (params.model) {
    config.generativeAnswer.generativeModel = params.model;
  }
  if (params.systemPrompt) {
    config.generativeAnswer.useSystemPrompt = true;
    config.generativeAnswer.systemPrompt = params.systemPrompt;
  }

  config.generativeAnswer.ragStrategies.includeNeighbouringParagraphs =
    params.neighbouringParagraphs && !params.fullResource;
  if (params.neighbouringParagraphs && !params.fullResource) {
    config.generativeAnswer.ragStrategies.precedingParagraphs = 1;
    config.generativeAnswer.ragStrategies.succeedingParagraphs = 1;
  }
  config.generativeAnswer.ragStrategies.entireResourceAsContext = params.fullResource;
  config.generativeAnswer.ragStrategies.metadatasRagStrategy = params.metadatas;
  if (params.metadatas) {
    config.generativeAnswer.ragStrategies.metadatas = {
      [RAG_METADATAS.ORIGIN]: true,
      [RAG_METADATAS.LABELS]: true,
      [RAG_METADATAS.NERS]: true,
      [RAG_METADATAS.EXTRA]: true,
    };
  }
  config.generativeAnswer.ragStrategies.graphRagStrategy = params.graph;
  if (params.graph) {
    config.generativeAnswer.ragStrategies.graph = {
      hops: 1,
      top_k: 10,
      exclude_processor_relations: false,
      relation_text_as_paragraphs: false,
      generative_relation_ranking: false,
      suggest_query_entity_detection: false,
    };
  }

  return config;
}

interface NdjsonItem {
  type: string;
  text?: string;
}

@Injectable({ providedIn: 'root' })
export class RagAdviceService {
  private http = inject(HttpClient);

  private readonly PUBLIC_KB_URL =
    'https://europe-1.rag.progress.cloud/api/v1/kb/df8b4c24-2807-4888-ad6c-ae97357a638b/ask';

  generateAdvice(input: AdviceInput): Observable<AdviceResult> {
    const query = this.buildQuery(input);

    return this.http.post(this.PUBLIC_KB_URL, { query }, { responseType: 'text' }).pipe(
      map((rawText) => this.parseAdvice(this.extractAnswerFromNdjson(rawText))),
      catchError((err) => throwError(() => err)),
    );
  }

  private extractAnswerFromNdjson(rawText: string): string {
    // The /ask endpoint returns concatenated JSON objects with no newline delimiter.
    // Match every top-level {...} object (handles one level of nesting, sufficient for this payload).
    const objects = rawText.match(/\{(?:[^{}]|\{[^{}]*\})*\}/g) ?? [];
    return objects
      .map((chunk) => {
        try {
          return JSON.parse(chunk) as { item?: NdjsonItem };
        } catch {
          return null;
        }
      })
      .filter((parsed): parsed is { item: NdjsonItem } => parsed?.item?.type === 'answer')
      .map((parsed) => parsed.item.text ?? '')
      .join('');
  }

  private buildQuery(input: AdviceInput): string {
    const { question, answer, context, remiScores, params, status, userExpectation, iterationHistory } = input;
    const formattedStatus = this.formatStatus(status);

    // ── Situation block ───────────────────────────────────────────────────────
    const lines: string[] = [
      `You are an expert in Retrieval-Augmented Generation (RAG) systems.`,
      `A user needs help diagnosing why their knowledge base query is performing poorly.`,
      ``,
      `Question asked: "${question}"`,
    ];

    if (userExpectation) {
      lines.push(`User's expectation (use this to guide your diagnosis): ${userExpectation}`);
    }

    lines.push(`Answer received: ${answer || '(none)'}`, `Retrieval status: ${formattedStatus}`);

    if (remiScores) {
      lines.push(``);
      lines.push(`Quality scores (scale 0–5, higher is better):`);
      if (remiScores.answerRelevance !== undefined) {
        lines.push(
          `  Answer Relevance ${remiScores.answerRelevance.toFixed(2)}/5 — does the answer address the question?`,
        );
      }
      if (remiScores.contextRelevance !== undefined) {
        lines.push(
          `  Context Relevance ${remiScores.contextRelevance.toFixed(2)}/5 — did retrieval find content relevant to the question?`,
        );
      }
      if (remiScores.groundedness !== undefined) {
        lines.push(
          `  Groundedness ${remiScores.groundedness.toFixed(2)}/5 — is the answer supported by the retrieved content?`,
        );
      }
    }

    if (params) {
      const paramParts: string[] = [];
      if (params.minScoreSemantic !== undefined) paramParts.push(`min_score_semantic=${params.minScoreSemantic}`);
      if (params.minScoreBm25 !== undefined) paramParts.push(`min_score_bm25=${params.minScoreBm25}`);
      if (params.topK !== undefined) paramParts.push(`top_k=${params.topK}`);
      if (params.ragStrategies?.length) paramParts.push(`rag_strategies=[${params.ragStrategies.join(', ')}]`);
      if (params.rephrase !== undefined) paramParts.push(`rephrase=${params.rephrase}`);
      if (paramParts.length > 0) {
        lines.push(``, `Active pipeline settings: ${paramParts.join(', ')}`);
      }
    }

    if (context) {
      lines.push(``, `Retrieved context (first 1000 chars):`, context.slice(0, 1000));
    }

    // ── Exploration history ───────────────────────────────────────────────────
    if (iterationHistory && iterationHistory.length > 0) {
      lines.push(``, `Previous exploration rounds (do not repeat these):`);
      for (const r of iterationHistory) {
        const outcome =
          r.outcome === 'no_context'
            ? 'NO_CONTEXT — nothing was retrieved (threshold too strict)'
            : r.outcome === 'no_answer'
              ? 'no answer generated'
              : `answer obtained${r.remiAnswerRelevance !== undefined ? ` (AR=${r.remiAnswerRelevance.toFixed(1)}, CR=${r.remiContentRelevance?.toFixed(1) ?? '?'}, GR=${r.remiGroundedness?.toFixed(1) ?? '?'})` : ''}`;
        lines.push(`  Round ${r.round}: ${r.paramsDescription} → ${outcome}`);
        if (r.outcome === 'answer' && r.answer) {
          lines.push(`    Sample answer: "${r.answer.slice(0, 150)}"`);
        }
      }
    }

    // ── Parameter reference (descriptive, not prescriptive) ───────────────────
    lines.push(
      ``,
      `What each parameter controls:`,
      `  min_score_semantic (0.0–1.0): semantic similarity threshold. Too high → NO_CONTEXT; too low → irrelevant content retrieved.`,
      `  min_score_bm25 (0.0–10.0): keyword match threshold. Same trade-off.`,
      `  top_k: number of passages retrieved. Higher = more context but more noise.`,
      `  rephrase: rewrites the query using KB vocabulary before retrieval. Helps when user phrasing differs from KB content.`,
      `  rag_strategies:`,
      `    neighbouring_paragraphs — include passages adjacent to matched ones. Helps when evidence spans multiple paragraphs.`,
      `    full_resource — include the entire source document. Expensive; use when matched passages are too narrow.`,
      `    metadata_extension — attach document metadata (labels, categories) to each passage.`,
      `    graph_beta — graph traversal to find related entities (hops=1). Helps with concept-heavy or relational queries.`,
      `  systemPrompt: instruction sent to the LLM (e.g. "answer only from the provided context").`,
    );

    // ── Task ──────────────────────────────────────────────────────────────────
    lines.push(
      ``,
      `Look at the scores and what happened in previous rounds, then reason about which part of the pipeline is failing for this specific question.${userExpectation ? ` Factor in the user's stated expectation.` : ''} Write:`,
      ``,
      `DIAGNOSIS: 1–2 sentences explaining what the scores reveal about where the pipeline is failing. Reference the actual values.`,
      ``,
      `SUGGESTIONS:`,
      `1. <specific parameter change with exact value — explain why it addresses the diagnosed failure>`,
      `2. <second change>`,
      `3. <third change — omit if only 2 are needed>`,
      ``,
      `PARAMS_JSON: {"key": value}`,
      ``,
      `PARAMS_JSON rules (follow exactly):`,
      `- Must be valid JSON with double quotes. Example: PARAMS_JSON: {"minScoreSemantic": 0.3, "rephrase": true}`,
      `- Required when you suggest any parameter change. Must be the LAST line of your response.`,
      `- Do NOT embed PARAMS_JSON inside a sentence or paragraph.`,
      `- Valid keys only: minScoreSemantic, minScoreBm25, topK, ragStrategies, systemPrompt, rephrase`,
      `- ragStrategies must be a JSON array of strings using double quotes, e.g. ["neighbouring_paragraphs", "metadata_extension"]`,
      `- Do NOT suggest parameters already tried in previous rounds`,
      `- Do NOT use markdown headers or bold text in your response`,
    );

    return lines.join('\n');
  }

  private formatStatus(status?: string): string {
    switch (status) {
      case '0':
        return 'SUCCESS';
      case '-1':
        return 'ERROR';
      case '-2':
        return 'NO_CONTEXT (no relevant content found)';
      case '-3':
        return 'NO_RETRIEVAL_DATA';
      default:
        return status || 'unknown';
    }
  }

  private parseAdvice(rawResponse: string): AdviceResult {
    if (!rawResponse.trim()) {
      return {
        diagnosis: 'No response received from the advice service.',
        suggestions: [],
        rawResponse,
      };
    }

    // Extract DIAGNOSIS section — try plain `DIAGNOSIS:` first, fall back to `## DIAGNOSIS` header.
    const diagnosisMatch =
      rawResponse.match(
        /DIAGNOSIS:\s*([\s\S]+?)(?=\n\nSUGGESTIONS:|\nSUGGESTIONS:|\n\nPARAMS_JSON:|\nPARAMS_JSON:|$)/,
      ) ?? rawResponse.match(/##\s*DIAGNOSIS\s*\n([\s\S]+?)(?=\n##\s*SUGGESTIONS|\n\nPARAMS_JSON:|\nPARAMS_JSON:|$)/);
    const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : rawResponse.trim();

    // Extract SUGGESTIONS section — try plain `SUGGESTIONS:` first, fall back to `## SUGGESTIONS` header.
    // Capture numbered list items; strip **bold** markdown from each item before storing.
    const suggestionsBlockMatch =
      rawResponse.match(/SUGGESTIONS:\s*\n([\s\S]+?)(?=\n\nPARAMS_JSON:|\nPARAMS_JSON:|$)/) ??
      rawResponse.match(/##\s*SUGGESTIONS\s*\n([\s\S]+?)(?=\n##\s*\w|\nPARAMS_JSON:|$)/);
    const suggestions: string[] = [];
    if (suggestionsBlockMatch) {
      const lines = suggestionsBlockMatch[1].split('\n');
      for (const line of lines) {
        const itemMatch = line.match(/^\s*\d+\.\s+(.+)/);
        if (itemMatch) {
          // Strip **bold** markers (replace **text** with text)
          const cleaned = itemMatch[1].trim().replace(/\*\*(.+?)\*\*/g, '$1');
          suggestions.push(cleaned);
        }
      }
    }

    // Extract PARAMS_JSON section — two-stage approach to handle well-formed and malformed output.
    let suggestedParams: SuggestedAdviceParams | undefined;
    let rawSuggestedParams: Record<string, unknown> | undefined;

    // Grab everything after "PARAMS_JSON:" on its line (single-line content from the LLM).
    const paramsLineMatch = rawResponse.match(/PARAMS_JSON:(.+)/);

    if (paramsLineMatch) {
      const lineContent = paramsLineMatch[1];

      // Stage 1 — well-formed path: locate a {...} block, strip inline comments, JSON.parse.
      let stage1Succeeded = false;
      const jsonBlockMatch = lineContent.match(/\{[^}]*\}/);
      if (jsonBlockMatch) {
        const jsonText = jsonBlockMatch[0].replace(/\/\/[^\n]*/g, '').trim();
        try {
          const parsed = JSON.parse(jsonText);
          if (this.isSuggestedParamsRecord(parsed)) {
            rawSuggestedParams = parsed;
            stage1Succeeded = true;
          }
        } catch {
          console.warn('[RagAdviceService] Stage 1: malformed JSON block in PARAMS_JSON:', jsonText);
        }
      }

      // Stage 1.5 — handle the KB's consistent "missing opening {" pattern.
      // The KB always outputs `PARAMS_JSON: firstKey": value, "key2": value2` (opening `{` and first `"`
      // are stripped). Wrap the line content and try parsing before the full Stage 2 scan.
      if (!stage1Succeeded) {
        const reconstructed = '{"' + lineContent.trim() + '}';
        try {
          const parsed = JSON.parse(reconstructed);
          if (this.isSuggestedParamsRecord(parsed)) {
            rawSuggestedParams = parsed;
            stage1Succeeded = true;
          }
        } catch {
          // Truncated or otherwise unparseable — fall through to Stage 2
        }
      }

      // Stage 2 — fallback: extract individual key-value pairs when no valid {...} block exists.
      // Handles output like `PARAMS_JSON:minScoreSemantic": 0.3` (missing braces, stray quotes).
      if (!stage1Succeeded) {
        const KNOWN_KEYS = [
          'minScoreSemantic',
          'minScoreBm25',
          'topK',
          'ragStrategies',
          'systemPrompt',
          'rephrase',
        ] as const;
        type KnownKey = (typeof KNOWN_KEYS)[number];

        // Match: optional leading junk, word-char key, optional stray `"`, colon+space, value.
        // Value may be: a JSON array [...], a quoted string "...", a bare boolean, or a bare number.
        const kvRegex = /[^,\w]*(\w+)"?\s*:\s*(\[[^\]]*\]|"[^"]*"|true|false|-?\d+(?:\.\d+)?)/g;
        const extracted: Record<string, unknown> = {};
        let kvMatch: RegExpExecArray | null;

        while ((kvMatch = kvRegex.exec(lineContent)) !== null) {
          const key = kvMatch[1] as KnownKey;
          if (!(KNOWN_KEYS as readonly string[]).includes(key)) {
            continue;
          }
          const rawVal = kvMatch[2];
          if (rawVal.startsWith('[')) {
            try {
              extracted[key] = JSON.parse(rawVal);
            } catch {
              // Unparseable array — skip this key
            }
          } else if (rawVal === 'true') {
            extracted[key] = true;
          } else if (rawVal === 'false') {
            extracted[key] = false;
          } else if (rawVal.startsWith('"')) {
            extracted[key] = rawVal.slice(1, -1);
          } else if (key === 'topK') {
            extracted[key] = parseInt(rawVal, 10);
          } else {
            extracted[key] = parseFloat(rawVal);
          }
        }

        if (Object.keys(extracted).length > 0) {
          rawSuggestedParams = extracted;
        } else {
          console.warn('[RagAdviceService] Stage 2: no known key-value pairs found in PARAMS_JSON line:', lineContent);
        }
      }
    }

    // Inline-value fallback — when PARAMS_JSON is absent entirely (e.g. markdown-format response
    // that never emitted the line), scan all suggestion text for parameter values mentioned inline.
    // Best-effort only: extracts the first matched value for each recognised pattern.
    if (!rawSuggestedParams && suggestions.length > 0) {
      const allSuggestionText = suggestions.join('\n');
      const inlineExtracted: Record<string, unknown> = {};

      const semanticMatch = allSuggestionText.match(/min_score_semantic\s+(?:from\s+[\d.]+\s+)?to\s+([\d.]+)/i);
      if (semanticMatch) {
        inlineExtracted['minScoreSemantic'] = parseFloat(semanticMatch[1]);
      }

      const bm25Match = allSuggestionText.match(/min_score_bm25\s+(?:from\s+[\d.]+\s+)?to\s+([\d.]+)/i);
      if (bm25Match) {
        inlineExtracted['minScoreBm25'] = parseFloat(bm25Match[1]);
      }

      const topKMatch = allSuggestionText.match(/top_k\s+(?:from\s+\d+\s+)?to\s+(\d+)/i);
      if (topKMatch) {
        inlineExtracted['topK'] = parseInt(topKMatch[1], 10);
      }

      if (Object.keys(inlineExtracted).length > 0) {
        rawSuggestedParams = inlineExtracted;
      }
    }

    // Post-parse validation: ensure min_score_* params are within their valid ranges regardless
    // of which parse stage succeeded. minScoreSemantic is in 0.0–1.0; minScoreBm25 is in 0.0–10.0
    // (BM25 scores are not bounded at 1.0). Discards values where the LLM confused scales
    // (e.g. it output 2.6 for a semantic score when it meant "current score 2.5 + 0.1").
    if (rawSuggestedParams) {
      if (rawSuggestedParams['model'] !== undefined) {
        console.warn('[RagAdviceService] post-parse: ignoring unsupported advisor model suggestion');
        delete rawSuggestedParams['model'];
      }

      const semanticVal = rawSuggestedParams['minScoreSemantic'];
      if (typeof semanticVal === 'number' && (semanticVal > 1.0 || semanticVal < 0.0)) {
        console.warn(
          `[RagAdviceService] post-parse: minScoreSemantic value ${semanticVal} is out of 0.0–1.0 range, discarding`,
        );
        delete rawSuggestedParams['minScoreSemantic'];
      }

      const bm25Val = rawSuggestedParams['minScoreBm25'];
      if (typeof bm25Val === 'number' && (bm25Val > 10.0 || bm25Val < 0.0)) {
        console.warn(
          `[RagAdviceService] post-parse: minScoreBm25 value ${bm25Val} is out of 0.0–10.0 range, discarding`,
        );
        delete rawSuggestedParams['minScoreBm25'];
      }

      suggestedParams = rawSuggestedParams as SuggestedAdviceParams;
    }

    return {
      diagnosis,
      suggestions,
      suggestedParams,
      rawResponse,
    };
  }

  private isSuggestedParamsRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}
