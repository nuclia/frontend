import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    ragStrategies?: string[];
    model?: string;
    filter?: string;
  };
  status?: string;
  userExpectation?: string;
}

export interface AdviceResult {
  diagnosis: string;
  suggestions: string[];
  suggestedParams?: Partial<{
    minScoreSemantic: number;
    minScoreBm25: number;
    topK: number;
    ragStrategies: string[];
    model: string;
    systemPrompt: string;
    rephrase: boolean;
  }>;
  rawResponse: string;
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

    return this.http
      .post(this.PUBLIC_KB_URL, { query }, { params: { synchronous: 'true' }, responseType: 'text' })
      .pipe(
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
    const { question, answer, context, remiScores, params, status, userExpectation } = input;

    const formattedStatus = this.formatStatus(status);
    const truncatedContext = context ? context.slice(0, 1500) : null;

    const scoreLines: string[] = [];
    if (remiScores) {
      if (remiScores.answerRelevance !== undefined) {
        scoreLines.push(`  - Answer Relevance: ${remiScores.answerRelevance.toFixed(2)} / 5`);
      }
      if (remiScores.contextRelevance !== undefined) {
        scoreLines.push(`  - Context Relevance: ${remiScores.contextRelevance.toFixed(2)} / 5`);
      }
      if (remiScores.groundedness !== undefined) {
        scoreLines.push(`  - Groundedness: ${remiScores.groundedness.toFixed(2)} / 5`);
      }
    }

    const paramLines: string[] = [];
    if (params) {
      if (params.minScoreSemantic !== undefined) {
        paramLines.push(`  - min_score_semantic: ${params.minScoreSemantic}`);
      }
      if (params.minScoreBm25 !== undefined) {
        paramLines.push(`  - min_score_bm25: ${params.minScoreBm25}`);
      }
      if (params.ragStrategies !== undefined && params.ragStrategies.length > 0) {
        paramLines.push(`  - rag_strategies: ${params.ragStrategies.join(', ')}`);
      }
      if (params.model) {
        paramLines.push(`  - model: ${params.model}`);
      }
      if (params.filter) {
        paramLines.push(`  - filter: ${params.filter}`);
      }
    }

    const sections: string[] = [
      `I need help tuning a Nuclia RAG (Retrieval-Augmented Generation) pipeline. Here is the diagnostic data:`,
      ``,
      `## Query & Response`,
      `Question: ${question}`,
      `Answer: ${answer}`,
      `Status: ${formattedStatus}`,
    ];

    if (userExpectation) {
      sections.push(`User expectation: ${userExpectation}`);
    }

    if (scoreLines.length > 0) {
      sections.push(``, `## REMi Quality Scores (scale 0–5)`);
      sections.push(...scoreLines);
    }

    if (paramLines.length > 0) {
      sections.push(``, `## Current RAG Parameters`);
      sections.push(...paramLines);
    }

    if (truncatedContext) {
      sections.push(``, `## Retrieved Context (truncated to 1500 chars)`, truncatedContext);
    }

    sections.push(
      ``,
      `## Nuclia RAG Parameter Reference`,
      ``,
      `| Parameter | What it controls | Primary REMi impact |`,
      `|-----------|-----------------|---------------------|`,
      `| min_score_semantic | Semantic search quality threshold (0.0–1.0 scale, NOT the REMi 0–5 scale). Too low = noise; too high = NO_CONTEXT | context_relevance |`,
      `| min_score_bm25 | Keyword search quality threshold | context_relevance |`,
      `| top_k | Number of context chunks retrieved. Low = missing evidence; high = noisy context | context_relevance, groundedness |`,
      `| rag_strategies: hierarchy | Includes document titles/headings with each paragraph | answer_relevance, context_relevance |`,
      `| rag_strategies: neighbouring_paragraphs | Adds N paragraphs before/after each matched paragraph | groundedness (primary) |`,
      `| rag_strategies: full_resource | Includes the entire source document in context (expensive) | groundedness |`,
      `| rag_strategies: prequeries | Runs extra search queries to retrieve additional relevant context | context_relevance |`,
      `| model | The generative LLM. Low answer_relevance with good context = wrong model | answer_relevance |`,
      ``,
      `IMPORTANT: For the \`model\` parameter:`,
      `- ONLY include model in PARAMS_JSON if you have been given a current \`model\` value in the diagnostic data above.`,
      `- If you suggest a different model, you MUST use one of these exact identifiers ONLY: chatgpt-azure-4o, chatgpt-azure-4-turbo, gemini-1-5-pro-001, claude-3-5-sonnet.`,
      `- Do NOT invent model names. Do NOT use names like "new model", "gpt-4", "gpt-4o", or any other variant not in the list above.`,
      `- If unsure, OMIT model from PARAMS_JSON entirely.`,
      `| systemPrompt | System-level instruction to the LLM. Controls evasion and hallucination | answer_relevance, groundedness |`,
      `| rephrase | Rewrites the query before retrieval using domain vocabulary | context_relevance |`,
      ``,
      `## Diagnostic Rules (apply the FIRST matching rule)`,
      ``,
      `RULE 1 — All scores ≤ 1.5 AND status = NO_CONTEXT:`,
      `  Root cause: Nothing was retrieved. Either the KB lacks content OR min_score_semantic is too strict.`,
      `  Fix priority: Lower min_score_semantic to 0.4–0.5. Check if filter_expression is over-restricting.`,
      `  Do NOT suggest model changes.`,
      ``,
      `RULE 2 — All scores ≤ 1.5 AND status = SUCCESS (something retrieved but all scores bad):`,
      `  Root cause: Retrieval failure — wrong content retrieved. The embedded query doesn't match KB content.`,
      `  Fix priority: 1) Lower min_score_semantic slightly (try 0.4), 2) Add rag_strategies: hierarchy,`,
      `  3) Enable rephrase if query phrasing might differ from KB vocabulary.`,
      ``,
      `RULE 3 — answer_relevance HIGH (≥ 3.5), context_relevance LOW (≤ 2):`,
      `  Root cause: LLM is answering from its own training knowledge, NOT from the KB. Hallucination pattern.`,
      `  Fix priority: 1) Add a strong systemPrompt: "Answer ONLY using the provided context. If the answer`,
      `  is not in the context, say you don't have that information." 2) Check if KB actually contains`,
      `  information about this topic (may be a content gap).`,
      `  Do NOT suggest lowering min_score_semantic.`,
      ``,
      `RULE 4 — context_relevance HIGH (≥ 3.5), answer_relevance LOW (≤ 2):`,
      `  Root cause: The KB has the right content, but the LLM is ignoring it or being evasive.`,
      `  Fix priority: 1) Switch model (the model is the primary suspect), 2) Simplify systemPrompt if one`,
      `  exists. This is the ONLY pattern where switching model is the primary fix.`,
      ``,
      `RULE 5 — context_relevance HIGH (≥ 3.5), answer_relevance HIGH (≥ 3.5), groundedness LOW (≤ 2):`,
      `  Root cause: LLM answer is relevant but not supported by retrieved text. Either adding claims beyond`,
      `  context OR the supporting evidence wasn't in the retrieved paragraphs.`,
      `  Fix priority: 1) Add rag_strategies: neighbouring_paragraphs (evidence may be adjacent),`,
      `  2) Add systemPrompt grounding instruction, 3) Increase top_k.`,
      ``,
      `RULE 6 — All scores medium (2–3.5):`,
      `  Root cause: Noisy retrieval — mix of relevant and irrelevant content.`,
      `  Fix priority: 1) Add rag_strategies: hierarchy (cheapest improvement), 2) Increase min_score_semantic`,
      `  by 0.1 (IMPORTANT: min_score_semantic is on a 0.0–1.0 scale, NOT the REMi 0–5 scale; if the current`,
      `  value is known, add 0.1 to it; if no current value is set, use 0.55 as the target), 3) Reduce top_k`,
      `  to 10–12 to concentrate on best matches.`,
      ``,
      `RULE 7 — groundedness LOW specifically, answer/context acceptable:`,
      `  Root cause: Answer makes claims not found in retrieved paragraphs.`,
      `  Fix priority: Add rag_strategies: neighbouring_paragraphs. Also add systemPrompt grounding constraint.`,
      `  Do NOT suggest changing minScoreSemantic or minScoreBm25 for this pattern.`,
      ``,
      `## Your Task`,
      ``,
      `1. Identify which diagnostic RULE above applies to these specific scores.`,
      `2. Write a DIAGNOSIS that explains the root cause for THIS specific question ("${question}") —`,
      `   reference the actual score values and explain what they mean for this case.`,
      `3. Write 2–3 SUGGESTIONS that are specific to this situation. Do not use generic phrases like`,
      `   "add more content" unless context_relevance is high but the KB actually seems to lack information.`,
      `   Each suggestion must reference a specific parameter or action.`,
      `4. Output a PARAMS_JSON block with only the parameters you are recommending changing.`,
      ``,
      `IMPORTANT: Do NOT use markdown headers (##). Do NOT bold text with **. Use plain text only.`,
      ``,
      `Use EXACTLY this format (copy it verbatim, replacing only the content after the colons):`,
      ``,
      `DIAGNOSIS: The retrieval failure (all scores <= 1.5 with SUCCESS status) indicates the wrong content was retrieved. The min_score_semantic threshold of 0.7 is filtering out relevant paragraphs.`,
      ``,
      `SUGGESTIONS:`,
      `1. Lower min_score_semantic from 0.7 to 0.4 to retrieve more context paragraphs.`,
      `2. Add rag_strategies: hierarchy to include document headings with each paragraph.`,
      `3. Enable rephrase to rewrite the query in domain vocabulary before retrieval.`,
      ``,
      `PARAMS_JSON: {"minScoreSemantic": 0.4, "ragStrategies": ["hierarchy"], "rephrase": true}`,
      ``,
      `The PARAMS_JSON line is REQUIRED when you suggest any parameter change. It must be the last line. Do not put it inside a sentence.`,
      `(Valid keys: minScoreSemantic, minScoreBm25, topK, ragStrategies, model, systemPrompt, rephrase. The opening brace { is REQUIRED. ragStrategies is an array of strings: ["hierarchy", "neighbouring_paragraphs"]. rephrase is a boolean. systemPrompt is a string.)`,
    );

    return sections.join('\n');
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
      rawResponse.match(/DIAGNOSIS:\s*([\s\S]+?)(?=\n\nSUGGESTIONS:|\nSUGGESTIONS:|\n\nPARAMS_JSON:|\nPARAMS_JSON:|$)/) ??
      rawResponse.match(/##\s*DIAGNOSIS\s*\n([\s\S]+?)(?=\n##\s*SUGGESTIONS|\n\nPARAMS_JSON:|\nPARAMS_JSON:|$)/);
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
    let suggestedParams:
      | Partial<{
          minScoreSemantic: number;
          minScoreBm25: number;
          topK: number;
          ragStrategies: string[];
          model: string;
          systemPrompt: string;
          rephrase: boolean;
        }>
      | undefined;

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
          suggestedParams = JSON.parse(jsonText);
          stage1Succeeded = true;
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
          suggestedParams = JSON.parse(reconstructed);
          stage1Succeeded = true;
        } catch {
          // Truncated or otherwise unparseable — fall through to Stage 2
        }
      }

      // Stage 2 — fallback: extract individual key-value pairs when no valid {...} block exists.
      // Handles output like `PARAMS_JSON:minScoreSemantic": 0.3` (missing braces, stray quotes).
      if (!stage1Succeeded) {
        const KNOWN_KEYS = ['minScoreSemantic', 'minScoreBm25', 'topK', 'model', 'ragStrategies', 'systemPrompt', 'rephrase'] as const;
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
          suggestedParams = extracted as typeof suggestedParams;
        } else {
          console.warn('[RagAdviceService] Stage 2: no known key-value pairs found in PARAMS_JSON line:', lineContent);
        }
      }
    }

    // Inline-value fallback — when PARAMS_JSON is absent entirely (e.g. markdown-format response
    // that never emitted the line), scan all suggestion text for parameter values mentioned inline.
    // Best-effort only: extracts the first matched value for each recognised pattern.
    if (!suggestedParams && suggestions.length > 0) {
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
        suggestedParams = inlineExtracted as unknown as typeof suggestedParams;
      }
    }

    // Post-parse validation: ensure min_score_* params are in 0.0–1.0 range regardless of which
    // parse stage succeeded. Discards values where the LLM confused the REMi 0–5 scale with the
    // 0.0–1.0 threshold scale (e.g. it output 2.6 when it meant "current score 2.5 + 0.1").
    if (suggestedParams) {
      for (const scoreKey of ['minScoreSemantic', 'minScoreBm25'] as const) {
        const val = suggestedParams[scoreKey];
        if (val !== undefined && (val > 1.0 || val < 0.0)) {
          console.warn(`[RagAdviceService] post-parse: ${scoreKey} value ${val} is out of 0.0–1.0 range, discarding`);
          delete suggestedParams[scoreKey];
        }
      }

      // Validate model name — strip if it looks hallucinated (contains spaces or is too long)
      if (suggestedParams.model !== undefined) {
        const isValidModel = /^[a-z0-9][a-z0-9._/-]*[a-z0-9]$/i.test(suggestedParams.model) && suggestedParams.model.length <= 60;
        if (!isValidModel) {
          console.warn(`[RagAdviceService] post-parse: model "${suggestedParams.model}" looks hallucinated, discarding`);
          suggestedParams.model = undefined;
        }
      }
    }

    return {
      diagnosis,
      suggestions,
      suggestedParams,
      rawResponse,
    };
  }
}
