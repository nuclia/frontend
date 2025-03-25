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
    disableRAG,
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
  const TABLE_BORDER = new RegExp(/^[-|]+$/);

  $: text = addReferences(answer.text || '', answer.citations || {});

  $: sources = getSourcesResults(answer);

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
        let before = sliceUnicode(text, 0, ref.end);
        let after = sliceUnicode(text, ref.end);
        const lines = before.split('\n');
        const lastLine = lines[lines.length - 1];
        const lastLineIsTableBorder = TABLE_BORDER.test(lastLine);
        // if the citation marker has been positioned on a table border, we need to move it to the previous line
        // so it does not break the table
        if (lastLineIsTableBorder) {
          before = lines.slice(0, -1).join('\n');
          after = `\n${lastLine}${after}`;
        }
        const lastChar = before.slice(-1);
        // if the citation marker has been positioned after a cell, we need to move it into the cell
        // so it does not break the table
        if (lastChar === '|' || lastChar === '<') {
          before = before.slice(0, -1);
          after = `${lastChar}${after}`;
        }
        text = `${before}<span class="ref">${ref.index + 1}</span>${after}`;
      });
    return text;
  }

  function getSourcesResults(answer: Partial<Ask.Answer>): TypedResult[] {
    const resources = answer.sources?.resources || {};
    const graphPrequeryResources = answer?.prequeries?.graph?.resources || {};
    const citations = answer.citations || {};
    return Object.keys(citations).reduce((acc, citationId, index) => {
      // When using extra_context, the paragraphId is fake, like USER_CONTEXT_0
      // Note: the widget does not support extra_context, but a proxy could be injecting some
      // and it must not break the widget. The objective is not to display the citations properly in this case
      // (as customer should implement their own widget to handle this case), but just to not break the widget.
      if (citationId.includes('/')) {
        const citationPath = citationId.split('/');
        const [resourceId, shortFieldType, fieldId] = citationPath;
        const resource = resources[resourceId];
        const graphPrequeryResource = graphPrequeryResources[resourceId];
        if (resource && citationPath.length === 4) {
          // the citation is about a paragraph
          const paragraph = resource.fields?.[`/${shortFieldType}/${fieldId}`]?.paragraphs?.[
            citationId
          ] as RankedParagraph;
          if (paragraph) {
            paragraph.rank = index + 1;
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
        } else if ((resource && citationPath.length === 3) || graphPrequeryResource) {
          // the citation is about a resource or a relation
          const res = resources[resourceId] || graphPrequeryResource;
          const existing = acc.find((r) => r.id === res.id);
          if (!existing) {
            const field = {
              field_type: shortToLongFieldType(shortFieldType as SHORT_FIELD_TYPE) || FIELD_TYPE.generic,
              field_id: fieldId,
            };
            const fieldData = getFieldDataFromResource(res, field);
            const { resultType, resultIcon } = getResultType({ ...res, field, fieldData });
            acc.push({ ...res, resultType, resultIcon, field, fieldData, paragraphs: [], ranks: [index + 1] });
          } else {
            existing.ranks!.push(index + 1);
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
    <MarkdownRendering {text} />
  </div>
  {#if $showAttachedImages && images.length > 0}
    <div class="images">
      {#each images as image}
        <Image path={$imageTemplate.replace(IMAGE_PLACEHOLDER, image)} />
      {/each}
    </div>
  {/if}
  {#if !answer.inError}
    <div class="actions">
      {#if !$chat[rank]?.answer.incomplete}
        {#if !$hasNotEnoughData}
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
    {#if $isCitationsEnabled && !$hasNotEnoughData && !$disableRAG}
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
