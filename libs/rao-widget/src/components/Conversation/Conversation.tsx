import { useRaoContext } from '../../hooks/RaoContext';
import type { AragAnswer } from '@nuclia/core';
import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { IResources } from '../RaoWidget';

// @ts-expect-error - inline CSS imports are handled by the bundler
import styles from './Conversation.css?inline';
import { IResources } from '../RaoWidget';

// @ts-expect-error - inline CSS imports are handled by the bundler
import styles from './Conversation.css?inline';

interface IConversation {}

type ReasoningType = 'info' | 'step' | 'context' | 'answer' | 'error';

interface ReasoningItem {
  id: string;
  type: ReasoningType;
  badge: string;
  title: string;
  description?: string;
  notes?: string[];
}

interface SourceItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  displayUrl?: string;
  meta?: string;
  icon: string;
  thumbnail?: string;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const truncateText = (value: string, limit = 200): string => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit).trimEnd()}…`;
};

const formatNumericValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim() !== '') {
    return formatNumericValue(Number(value));
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  const absolute = Math.abs(value);
  if (absolute === 0) {
    return '0';
  }
  if (absolute < 1) {
    return value.toFixed(2);
  }
  if (absolute >= 1000) {
    return value.toLocaleString();
  }
  return value.toString();
};

const formatDuration = (value: unknown): string | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  const absolute = Math.abs(value);
  if (absolute >= 1) {
    return `${absolute.toFixed(2)}s`;
  }
  return `${(absolute * 1000).toFixed(0)}ms`;
};

const formatTimecode = (value: number): string => {
  const totalMilliseconds = value < 1000 ? value * 1000 : value;
  const totalSeconds = Math.max(0, Math.round(totalMilliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const deriveTitleFromUrl = (candidate?: string | null): string | null => {
  if (!isNonEmptyString(candidate)) {
    return null;
  }
  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return hostname;
    }
    return `${hostname}/${segments[segments.length - 1]}`;
  } catch (error) {
    return candidate;
  }
};

const formatDisplayUrl = (candidate?: string): string | undefined => {
  if (!isNonEmptyString(candidate)) {
    return undefined;
  }
  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.replace(/^www\./, '');
    return hostname;
  } catch (error) {
    return candidate;
  }
};

const pickSourceIcon = (url?: string): string => {
  if (!isNonEmptyString(url)) {
    return 'file';
  }
  const lower = url.toLowerCase();
  if (/(youtube|vimeo|\/videos?\/)/.test(lower) || /\.(mp4|mov|wmv|avi)$/.test(lower)) {
    return 'play';
  }
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) {
    return 'image';
  }
  if (/\.(pdf)$/.test(lower)) {
    return 'file-pdf';
  }
  return 'file';
};

const extractMetaLabel = (metadata: unknown, resources: IResources): string | null => {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  const data = metadata as Record<string, unknown>;

  const page = data.page ?? data.Page ?? data.page_number;
  if (isNonEmptyString(page) || typeof page === 'number') {
    return `${resources.meta_page} ${String(page)}`;
  }

  const timestamp = data.timestamp ?? data.time ?? data.jump_to;
  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    return `${resources.meta_jumpto} ${formatTimecode(timestamp * (timestamp < 1000 ? 1 : 1 / 1000))}`;
  }
  if (isNonEmptyString(timestamp)) {
    return `${resources.meta_jumpto} ${timestamp}`;
  }

  return null;
};

const extractSources = (entries: AragAnswer[] | undefined, messageId: string, resources: IResources): SourceItem[] => {
  if (!entries || entries.length === 0) {
    return [];
  }

  const sources = new Map<string, SourceItem>();

  entries.forEach((rawEntry, entryIndex) => {
    if (!rawEntry || !rawEntry.context) {
      return;
    }

    const contextData = rawEntry.context as {
      title?: string;
      agent?: string;
      chunks?: Array<{
        title?: string | null;
        text?: string | null;
        url?: string[];
        metadata?: Record<string, unknown> | null;
        thumbnail?: string | null;
      }>;
      citations?: unknown[];
    };

    const chunks = Array.isArray(contextData.chunks) ? contextData.chunks : [];
    chunks.forEach((chunk, chunkIndex) => {
      if (!chunk) {
        return;
      }

      const urls = Array.isArray(chunk.url) ? chunk.url.filter(isNonEmptyString) : [];
      const primaryUrl = urls[0];
      let metadataLabel = extractMetaLabel(chunk.metadata, resources);

      if (!metadataLabel && Array.isArray(contextData.citations) && contextData.citations.length > 0) {
        const citationCandidate = contextData.citations[chunkIndex] ?? contextData.citations[0];
        if (isNonEmptyString(citationCandidate) || typeof citationCandidate === 'number') {
          metadataLabel = `${resources.meta_citation} ${String(citationCandidate)}`;
        } else {
          metadataLabel = `${resources.meta_reference} ${chunkIndex + 1}`;
        }
      }

      const title = isNonEmptyString(chunk.title)
        ? chunk.title
        : isNonEmptyString(contextData.title)
          ? contextData.title
          : deriveTitleFromUrl(primaryUrl) ?? `${resources.meta_source} ${sources.size + 1}`;

      const description = isNonEmptyString(chunk.text) ? truncateText(chunk.text, 200) : undefined;
      const displayUrl = formatDisplayUrl(primaryUrl);
      const key = primaryUrl ?? `${title}-${chunkIndex}`;
      if (sources.has(key)) {
        return;
      }

      const thumbnail = isNonEmptyString(chunk.thumbnail) ? chunk.thumbnail : undefined;

      sources.set(key, {
        id: `${messageId}-source-${entryIndex}-${chunkIndex}`,
        title,
        description,
        url: primaryUrl,
        displayUrl,
        meta: metadataLabel ?? undefined,
        icon: pickSourceIcon(primaryUrl),
        thumbnail,
      });
    });
  });

  return Array.from(sources.values());
};

const humanizeDebugEntries = (
  entries: AragAnswer[] | undefined,
  messageId: string,
  resources: IResources,
): ReasoningItem[] => {
  if (!entries || entries.length === 0) {
    return [];
  }

  const items: ReasoningItem[] = [];

  entries.forEach((rawEntry, index) => {
    if (!rawEntry) {
      return;
    }

    const entry = rawEntry as Partial<AragAnswer> & {
      context?: unknown;
      possible_answer?: unknown;
    };

    const id = `${messageId}-reason-${index}`;
    const {
      exception,
      step,
      context,
      possible_answer: possibleAnswer,
      answer,
      generated_text: generatedText,
      agent_request: agentRequest,
    } = entry;

    if (!exception && !step && !context && !possibleAnswer && !answer && !generatedText && !agentRequest) {
      return;
    }

    if (exception) {
      const description = isNonEmptyString((exception as { detail?: unknown }).detail)
        ? String((exception as { detail: unknown }).detail)
        : resources.meta_unexpectedissue;
      const fallback = isNonEmptyString(answer) ? answer : undefined;
      items.push({
        id,
        type: 'error',
        badge: 'Error',
        title: 'Assistant error',
        description: fallback ? `${description} (${fallback})` : description,
      });
      return;
    }

    if (step) {
      const moduleLabel = isNonEmptyString(step.module) ? step.module.replace(/_/g, ' ') : resources.meta_step;
      const title = isNonEmptyString(step.title) ? step.title : moduleLabel;
      const description = isNonEmptyString(step.reason)
        ? step.reason
        : isNonEmptyString(step.value)
          ? step.value
          : undefined;

      const notes: string[] = [];
      if (isNonEmptyString(step.value) && step.value !== description) {
        notes.push(step.value);
      }
      if (isNonEmptyString(step.agent_path)) {
        notes.push(`${resources.meta_agent}: ${step.agent_path}`);
      }
      const duration = formatDuration(step.timeit);
      if (duration) {
        notes.push(`${resources.meta_duration}: ${duration}`);
      }
      const inputTokens = formatNumericValue((step as { input_nuclia_tokens?: unknown }).input_nuclia_tokens);
      if (inputTokens) {
        notes.push(`${resources.meta_inputtokens}: ${inputTokens}`);
      }
      const outputTokens = formatNumericValue((step as { output_nuclia_tokens?: unknown }).output_nuclia_tokens);
      if (outputTokens) {
        notes.push(`${resources.meta_outputtokens}: ${outputTokens}`);
      }

      items.push({
        id,
        type: 'step',
        badge: moduleLabel,
        title,
        description,
        notes: notes.length ? notes : undefined,
      });
      return;
    }

    if (context) {
      const contextData = context as {
        agent?: string;
        title?: string;
        summary?: string;
        question?: string;
        chunks?: Array<{ text?: string; url?: string[]; title?: string | null }>;
        citations?: unknown[];
      };

      const badge = isNonEmptyString(contextData.agent) ? contextData.agent : resources.meta_context;
      const title = isNonEmptyString(contextData.title) ? contextData.title : resources.meta_contextgathered;
      const description = isNonEmptyString(contextData.summary)
        ? contextData.summary
        : resources.meta_supportingevidence;
      const notes: string[] = [];
      if (isNonEmptyString(contextData.question)) {
        notes.push(`${resources.meta_questionanalysed}: ${contextData.question}`);
      }

      const chunks = Array.isArray(contextData.chunks) ? contextData.chunks : [];
      chunks.slice(0, 2).forEach((chunk) => {
        if (isNonEmptyString(chunk.text)) {
          notes.push(`${resources.meta_evidence}: ${truncateText(chunk.text)}`);
        }
        if (Array.isArray(chunk.url) && chunk.url.length > 0) {
          notes.push(`${resources.meta_sources}: ${chunk.url.slice(0, 3).join(', ')}`);
        }
      });

      if (Array.isArray(contextData.citations) && contextData.citations.length > 0) {
        notes.push(`${resources.meta_citations}: ${contextData.citations.join(', ')}`);
      }

      items.push({
        id,
        type: 'context',
        badge,
        title,
        description,
        notes: notes.length ? notes : undefined,
      });
      return;
    }

    if (possibleAnswer && typeof possibleAnswer === 'object' && possibleAnswer !== null) {
      const draftAnswer = (possibleAnswer as { answer?: unknown }).answer;
      if (isNonEmptyString(draftAnswer)) {
        items.push({
          id,
          type: 'info',
          badge: 'Draft',
          title: 'Draft response',
          description: draftAnswer,
        });
        return;
      }
    }

    if (isNonEmptyString(answer)) {
      items.push({
        id,
        type: 'answer',
        badge: 'Answer',
        title: 'Assistant response',
        description: answer,
      });
      return;
    }

    if (isNonEmptyString(generatedText)) {
      items.push({
        id,
        type: 'info',
        badge: 'Generated',
        title: 'Generated text',
        description: generatedText,
      });
      return;
    }

    if (isNonEmptyString(agentRequest)) {
      items.push({
        id,
        type: 'info',
        badge: 'Request',
        title: 'Agent request',
        description: agentRequest,
      });
    }
  });

  return items;
};

export const Conversation: React.FC<IConversation> = () => {
  const { conversation, nuclia, resources } = useRaoContext();
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!conversation || conversation.length === 0) {
      setExpandedMessages({});
      setExpandedSources({});
    }
  }, [conversation]);

  const assistantName = nuclia?.auth?.preview_short ?? nuclia?.auth?.name ?? 'Agentic RAG';
  const assistantDescription = nuclia?.auth?.preview_long;

  const toggleReasoning = useCallback((id: string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const toggleSources = useCallback((id: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <section
        className="rao-react__conversation"
        aria-live="polite">
        {conversation?.map((message) => {
          const isChip = message.variant === 'chip';
          const isAssistant = message.role === 'assistant' && !isChip;
          const articleClass = `rao-react__message rao-react__message--${message.role}`;

          if (isChip) {
            const bubbleClass = ['rao-react__message-bubble', 'rao-react__message-bubble--chip'];
            return (
              <article
                key={message.id}
                className={articleClass}>
                <div
                  className={bubbleClass.join(' ')}
                  data-testid={message.id}>
                  <span className="rao-react__message-chip">{message.content}</span>
                </div>
              </article>
            );
          }

          if (isAssistant) {
            const normalizedMeta = message.meta?.toLowerCase() ?? '';
            const canToggleReasoning = normalizedMeta === 'response generated';
            const isExpanded = canToggleReasoning && Boolean(expandedMessages[message.id]);
            const cardClassNames = ['rao-react__message-card'];
            if (isExpanded) {
              cardClassNames.push('is-expanded');
            }

            const nameForMessage = message.title ?? assistantName;
            const avatarInitials =
              nameForMessage
                ?.split(' ')
                .map((word) => word.charAt(0))
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AI';

            const contentParagraphs = message.content
              ? message.content
                  .split(/\r?\n+/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
              : [];

            const debugEntries = Array.isArray(message.debug) ? message.debug : [];
            const reasoningItems = humanizeDebugEntries(debugEntries, message.id, resources);
            const shouldRenderListInBody =
              Boolean(message.list?.length) && (!canToggleReasoning || reasoningItems.length === 0);
            const sources = extractSources(debugEntries, message.id, resources);
            const hasSources = sources.length > 0;
            const isSourcesExpanded = Boolean(expandedSources[message.id]);

            return (
              <article
                key={message.id}
                className={articleClass}>
                <div className={cardClassNames.join(' ')}>
                  {message.meta &&
                    (canToggleReasoning ? (
                      <button
                        type="button"
                        className="rao-react__message-card-toggle"
                        onClick={() => toggleReasoning(message.id)}
                        aria-expanded={isExpanded}>
                        <span>{message.meta}</span>
                        <Icon
                          icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size="sm"
                          className="rao-react__message-card-chevron"
                        />
                      </button>
                    ) : (
                      <span className="rao-react__message-card-label">{message.meta}</span>
                    ))}

                  {canToggleReasoning && isExpanded && (
                    <div className="rao-react__message-reasoning">
                      <span className="rao-react__message-reasoning-title">{resources.meta_reasoning}</span>
                      {reasoningItems.length > 0 ? (
                        <ol className="rao-react__message-reasoning-steps">
                          {reasoningItems.map((item) => (
                            <li
                              key={item.id}
                              className={`rao-react__message-reasoning-item rao-react__message-reasoning-item--${item.type}`}>
                              <div className="rao-react__message-reasoning-header">
                                <span className="rao-react__message-reasoning-badge">{item.badge}</span>
                                <span className="rao-react__message-reasoning-item-title">{item.title}</span>
                              </div>
                              {item.description && (
                                <p className="rao-react__message-reasoning-description">{item.description}</p>
                              )}
                              {item.notes && item.notes.length > 0 && (
                                <ul className="rao-react__message-reasoning-notes">
                                  {item.notes.map((note, noteIndex) => (
                                    <li key={`${item.id}-note-${noteIndex}`}>{note}</li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ol>
                      ) : message.list && message.list.length > 0 ? (
                        <ol className="rao-react__message-reasoning-list">
                          {message.list.map((item, index) => (
                            <li key={`${message.id}-reason-${index}`}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <div
                          className="rao-react__reasoning-skeleton"
                          aria-hidden="true">
                          <span className="rao-react__reasoning-skeleton-line" />
                          <span className="rao-react__reasoning-skeleton-line" />
                          <span className="rao-react__reasoning-skeleton-line" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rao-react__message-card-inner">
                    <header className="rao-react__message-card-author">
                      <span
                        aria-hidden="true"
                        className="rao-react__message-card-avatar">
                        {avatarInitials}
                      </span>
                      <div className="rao-react__message-card-author-details">
                        <p className="rao-react__message-card-author-name">{nameForMessage}</p>
                        {assistantDescription && (
                          <p className="rao-react__message-card-author-description">{assistantDescription}</p>
                        )}
                      </div>
                    </header>

                    <div
                      className="rao-react__message-card-body"
                      data-testid={message.id}>
                      {contentParagraphs.length > 0 ? (
                        contentParagraphs.map((paragraph, index) => (
                          <p
                            key={`${message.id}-paragraph-${index}`}
                            className="rao-react__message-content">
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <p
                          className="rao-react__message-content rao-react__message-content--placeholder"
                          aria-live="polite">
                          {message.meta ?? '...'}
                        </p>
                      )}

                      {shouldRenderListInBody && (
                        <ol className="rao-react__message-list">
                          {message.list!.map((item, index) => (
                            <li key={`${message.id}-item-${index}`}>{item}</li>
                          ))}
                        </ol>
                      )}
                    </div>

                    {hasSources && (
                      <div className={`rao-react__message-sources${isSourcesExpanded ? ' is-expanded' : ''}`}>
                        <button
                          type="button"
                          className="rao-react__message-sources-toggle"
                          onClick={() => toggleSources(message.id)}
                          aria-expanded={isSourcesExpanded}>
                          <span className="rao-react__message-sources-label">{resources.meta_sources}</span>
                          <span className="rao-react__message-sources-count">{sources.length}</span>
                          <Icon
                            icon={isSourcesExpanded ? 'chevron-up' : 'chevron-down'}
                            size="sm"
                            className="rao-react__message-sources-chevron"
                          />
                        </button>

                        {isSourcesExpanded && (
                          <ol className="rao-react__message-sources-list">
                            {sources.map((source) => (
                              <li
                                key={source.id}
                                className="rao-react__message-sources-item">
                                <div className="rao-react__message-sources-leading">
                                  <Icon
                                    icon={source.icon}
                                    size="sm"
                                    className="rao-react__message-sources-icon"
                                  />
                                </div>
                                <div className="rao-react__message-sources-body">
                                  <div className="rao-react__message-sources-header">
                                    <span className="rao-react__message-sources-title">{source.title}</span>
                                    {source.meta && (
                                      <span className="rao-react__message-sources-meta">{source.meta}</span>
                                    )}
                                  </div>
                                  {source.description && (
                                    <p className="rao-react__message-sources-description">{source.description}</p>
                                  )}
                                  {source.url && (
                                    <a
                                      className="rao-react__message-sources-link"
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      {source.displayUrl ?? source.url}
                                    </a>
                                  )}
                                </div>
                                {source.thumbnail && (
                                  <img
                                    className="rao-react__message-sources-thumbnail"
                                    src={source.thumbnail}
                                    alt=""
                                    aria-hidden="true"
                                  />
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          }

          const bubbleClass = ['rao-react__message-bubble'];
          const contentParagraphs = message.content
            ? message.content
                .split(/\r?\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
            : [];
          return (
            <article
              key={message.id}
              className={articleClass}>
              {message.meta && <span className="rao-react__message-meta">{message.meta}</span>}
              <div
                className={bubbleClass.join(' ')}
                data-testid={message.id}>
                {contentParagraphs.length > 0 ? (
                  contentParagraphs.map((paragraph, index) => (
                    <p
                      key={`${message.id}-paragraph-${index}`}
                      className="rao-react__message-content">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="rao-react__message-content">{message.content}</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
};
