<script lang="ts">
  import { _ } from '../../core/i18n';
  import Feedback from './Feedback.svelte';
  import type { Ask, Citations, FieldId, Search } from '@nuclia/core';
  import { FIELD_TYPE, SHORT_FIELD_TYPE, shortToLongFieldType, sliceUnicode } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
  import { Button, Expander, IconButton, Tooltip } from '../../common';
  import { MarkdownRendering } from '../viewer';
  import Sources from './Sources.svelte';
  import AnswerMetadata from './AnswerMetadata.svelte';
  import Image from '../image/Image.svelte';
  import {
    chat,
    debug,
    disclaimer,
    downloadDump,
    expandedCitations,
    feedbackOnAnswer,
    getAttachedImageTemplate,
    getFieldDataFromResource,
    getNonGenericField,
    getResultType,
    hasNotEnoughData,
    isCitationsEnabled,
    notEnoughDataMessage,
    showAttachedImages,
    type RankedParagraph,
    type TypedResult,
  } from '../../core';
  import ConfirmDialog from '../../common/modal/ConfirmDialog.svelte';
  import { take } from 'rxjs';

  export let answer: Partial<Ask.Answer>;
  export let rank = 0;
  export let initialAnswer = false;
  let text = '';
  let selectedCitation: number | undefined;
  let element: HTMLElement | undefined;
  let copied = false;
  let showMetadata = false;
  let showDisclaimer = false;

  const dispatch = createEventDispatcher();

  const IMAGE_PLACEHOLDER = '__IMAGE_PATH__';
  const imageTemplate = getAttachedImageTemplate(IMAGE_PLACEHOLDER);

  $: text = addReferences(answer.text || '', answer.citations || {});
  $: notEnoughData = hasNotEnoughData(answer.text || '');

  $: sources =
    answer.citations && answer.sources?.resources ? getSourcesResults(answer.sources?.resources, answer.citations) : [];

  $: sources &&
    (element?.querySelectorAll('.sw-answer .ref') || []).forEach((ref) => {
      ref.addEventListener('mouseenter', onMouseEnter);
      ref.addEventListener('mouseleave', onMouseLeave);
    });

  $: images =
    answer.citations && sources
      ? sources.reduce(
          (all, source) =>
            all.concat(
              source.paragraphs
                .filter((paragraph) => paragraph.reference)
                .map(
                  (paragraph) =>
                    `${source.id}/${source.field?.field_type}/${source.field?.field_id}/download/extracted/generated/${paragraph.reference}`,
                ),
            ),
          [] as string[],
        )
      : [];

  function addReferences(text: string, citations: Citations) {
    Object.values(citations)
      .reduce(
        (acc, curr, index) => [...acc, ...curr.map(([, end]) => ({ index, end }))],
        [] as { index: number; end: number }[],
      )
      .sort((a, b) => (a.end - b.end !== 0 ? a.end - b.end : a.index - b.index))
      .reverse()
      .forEach((ref) => {
        text = `${sliceUnicode(text, 0, ref.end)}<span class="ref">${ref.index + 1}</span>${sliceUnicode(
          text,
          ref.end,
        )}`;
      });
    return text;
  }

  function getSourcesResults(resources: { [key: string]: Search.FindResource }, citations: Citations): TypedResult[] {
    return Object.keys(citations).reduce((acc, citationId, index) => {
      // When using extra_context, the paragraphId is fake, like USER_CONTEXT_0
      // Note: the widget does not support extra_context, but a proxy could be injecting some
      // and it must not break the widget. The objective is not to display the citations properly in this case
      // (as customer should implement their own widget to handle this case), but just to not break the widget.
      if (citationId.includes('/')) {
        const citationPath = citationId.split('/');
        const [resourceId, shortFieldType, fieldId] = citationPath;
        const resource = resources[resourceId];
        if (resource) {
          if (citationPath.length === 4) {
            // the citation is about a paragraph
            const paragraph = resources[resourceId]?.fields?.[`/${shortFieldType}/${fieldId}`]?.paragraphs?.[
              citationId
            ] as RankedParagraph;
            paragraph.rank = index + 1;
            if (paragraph) {
              let field: FieldId;
              if (shortFieldType === SHORT_FIELD_TYPE.generic) {
                // we take the first other field that is not generic
                field = getNonGenericField(resource.data || {});
              } else {
                field = {
                  field_type: shortToLongFieldType(shortFieldType as SHORT_FIELD_TYPE) || FIELD_TYPE.generic,
                  field_id: fieldId,
                };
              }
              const existing = acc.find((r) => r.id === resource.id && r.field?.field_id === field.field_id);
              if (!existing) {
                const fieldData = getFieldDataFromResource(resource, field);
                const { resultType, resultIcon } = getResultType({ ...resource, field, fieldData });
                acc.push({ ...resource, resultType, resultIcon, field, fieldData, paragraphs: [paragraph] });
              } else {
                existing.paragraphs!.push(paragraph);
              }
            }
          } else if (citationPath.length === 3) {
            // the citation is about a resource
            const existing = acc.find((r) => r.id === resource.id);
            if (!existing) {
              const field = {
                field_type: shortToLongFieldType(shortFieldType as SHORT_FIELD_TYPE) || FIELD_TYPE.generic,
                field_id: fieldId,
              };
              const fieldData = getFieldDataFromResource(resource, field);
              const { resultType, resultIcon } = getResultType({ ...resource, field, fieldData });
              acc.push({ ...resource, resultType, resultIcon, field, fieldData, paragraphs: [], ranks: [index + 1] });
            } else {
              existing.ranks!.push(index + 1);
            }
          }
        }
      }
      return acc;
    }, [] as TypedResult[]);
  }

  function onMouseEnter(event: Event) {
    selectedCitation = parseInt((event.target as HTMLElement).textContent || '') - 1;
  }

  function onMouseLeave() {
    selectedCitation = undefined;
  }

  function copyAnswer() {
    disclaimer.pipe(take(1)).subscribe((message) => {
      if (message) {
        showDisclaimer = true;
      } else {
        _copyAnswer();
      }
    });
  }

  function copyAfterConfirm() {
    _copyAnswer();
    showDisclaimer = false;
  }

  function _copyAnswer() {
    let copy = answer.text || '';
    const paragraphs = sources.reduce(
      (acc, result) => acc.concat(result.paragraphs.map((paragraph) => paragraph.text)),
      [] as string[],
    );
    if (paragraphs.length > 0) {
      copy += `\n\n${$_('answer.sources')}:\n` + paragraphs.join('\n\n');
    }
    navigator.clipboard.writeText(copy).then(() => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
  }
</script>

<div
  class="sw-answer"
  bind:this={element}>
  <div
    class="answer-text"
    class:error={answer.inError}>
    {#if notEnoughData && $notEnoughDataMessage}
      {@html $notEnoughDataMessage}
    {:else}
      <MarkdownRendering {text} />
    {/if}
  </div>
  {#if $showAttachedImages && images.length > 0}
    <div class="images">
      {#each images as image}
        <Image path={$imageTemplate.replace(IMAGE_PLACEHOLDER, image)} />
      {/each}
    </div>
  {/if}
  {#if answer.sources}
    <div class="actions">
      {#if !$chat[rank]?.answer.incomplete}
        {#if !notEnoughData}
          <div class="copy smaller">
            <IconButton
              aspect="basic"
              icon={copied ? 'check' : 'copy'}
              size="small"
              kind="secondary"
              on:click={() => copyAnswer()} />
            <Tooltip
              visible={copied}
              title={$_('answer.copied')}
              x="0"
              y="34" />
          </div>
          {#if $feedbackOnAnswer}
            <div>
              <Feedback {rank} />
            </div>
          {/if}
          {#if $debug}
            <div class="smaller">
              <IconButton
                aspect="basic"
                icon="info"
                size="small"
                kind="secondary"
                on:click={() => (showMetadata = true)} />
              <AnswerMetadata
                {answer}
                bind:show={showMetadata} />
            </div>
          {/if}
          {#if initialAnswer}
            <Button
              aspect="basic"
              size="small"
              on:click={() => dispatch('openChat')}>
              <span class="go-to-chat title-s">{$_('answer.chat-action')}</span>
            </Button>
          {/if}
        {/if}
        {#if $debug}
          <Button
            aspect="basic"
            size="small"
            on:click={() => downloadDump()}>
            <span class="title-s">{$_('answer.download-log')}</span>
          </Button>
        {/if}
      {/if}
    </div>
    {#if $isCitationsEnabled && !notEnoughData}
      <div class="sources-container">
        {#if sources.length > 0}
          <Expander expanded={$expandedCitations === undefined ? initialAnswer : $expandedCitations}>
            <div
              class="title-s"
              slot="header">
              {$_('answer.sources')}
            </div>
            <div class="sources-list">
              <Sources
                {sources}
                answerRank={rank}
                selected={selectedCitation} />
            </div>
          </Expander>
        {:else if !answer.incomplete}
          <div class="title-s">{$_('answer.sources')}</div>
          <div class="no-citations">{$_('answer.no-citations')}</div>
        {/if}
      </div>
    {/if}
  {/if}
  <ConfirmDialog
    show={showDisclaimer}
    closeable={true}
    on:cancel={() => (showDisclaimer = false)}
    on:confirm={copyAfterConfirm}>
    {$disclaimer}
  </ConfirmDialog>
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
