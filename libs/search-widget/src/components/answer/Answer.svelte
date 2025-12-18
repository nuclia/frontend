<script lang="ts">
  import type { Ask } from '@nuclia/core';
  import { take } from 'rxjs';
  import { createEventDispatcher } from 'svelte';
  import { Button, Expander, Icon, IconButton, Tooltip } from '../../common';
  import ConfirmDialog from '../../common/modal/ConfirmDialog.svelte';
  import {
    chat,
    debug,
    disableRAG,
    disclaimer,
    downloadDump,
    expandedCitations,
    feedbackOnAnswer,
    getAttachedImageTemplate,
    hasNotEnoughData,
    hideAnswer,
    isCitationsEnabled,
    showAttachedImages,
    getSourcesResults,
    addReferences,
    markdownToHTML,
  } from '../../core';
  import { _ } from '../../core/i18n';
  import Image from '../image/Image.svelte';
  import { MarkdownRendering } from '../viewer';
  import DebugInfo from './DebugInfo.svelte';
  import Feedback from './Feedback.svelte';
  import Sources from './Sources.svelte';
  import DOMPurify from 'dompurify';

  interface Props {
    answer: Partial<Ask.Answer>;
    rank?: number;
    initialAnswer?: boolean;
  }

  let { answer, rank = 0, initialAnswer = false }: Props = $props();
  let text = $derived(addReferences(answer, true));
  let reasoning = $derived(answer.reasoning);
  let sources = $derived(getSourcesResults(answer));
  let selectedCitation: number | undefined = $state();
  let element: HTMLElement | undefined = $state();
  let copied = $state(false);
  let showMetadata = $state(false);
  let showDisclaimer = $state(false);

  const dispatch = createEventDispatcher();

  const IMAGE_PLACEHOLDER = '__IMAGE_PATH__';
  const imageTemplate = getAttachedImageTemplate(IMAGE_PLACEHOLDER);

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
    let text = addReferences(answer, false);
    text = markdownToHTML(text, true);
    const paragraphs = sources.reduce(
      (acc, result) =>
        acc.concat(
          result.paragraphs.map((paragraph) => {
            const url = result.origin?.url;
            const link = url ? `<a href="${url}">${result.title}</a>` : result.title;
            const title = DOMPurify.sanitize(`<h3>[${paragraph.rank}] ${link}</h3>`);
            return `${title}\n${markdownToHTML(paragraph.text, false)}`;
          }),
        ),
      [] as string[],
    );
    if (paragraphs.length > 0) {
      text = `${text}
<h2>${$_('answer.sources')}:</h2>
${paragraphs.join('\n<hr>\n')}`;
    }
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([text], { type: 'text/html' }),
    });
    navigator.clipboard.write([clipboardItem]).then(() => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
  }

  $effect(() => {
    if (sources) {
      (element?.querySelectorAll('.sw-answer .ref') || []).forEach((ref) => {
        ref.addEventListener('mouseenter', onMouseEnter);
        ref.addEventListener('mouseleave', onMouseLeave);
      });
    }
  });
  let images = $derived(
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
      : [],
  );
</script>

<div
  class="sw-answer"
  bind:this={element}>
  {#if $debug && !$chat[rank]?.answer.incomplete}
    <div class="actions smaller">
      <IconButton
        aspect="basic"
        icon="info"
        size="small"
        kind="secondary"
        on:click={() => (showMetadata = true)} />
      <DebugInfo
        {answer}
        rephrasedQuery={answer.sources?.rephrased_query}
        bind:show={showMetadata} />
      <Button
        aspect="basic"
        size="small"
        on:click={() => downloadDump()}>
        <span class="title-s">{$_('answer.download-log')}</span>
      </Button>
    </div>
  {/if}
  {#if !$hideAnswer || answer.inError}
    {#if answer.text}
      <div class="answer-text">
        <MarkdownRendering
          {text}
          markers={true} />
      </div>
    {/if}
    {#if answer.inError}
      <div class="answer-text error">
        <Icon name="warning" />
        {answer.error}
      </div>
    {/if}
    {#if $showAttachedImages && images.length > 0}
      <div class="images">
        {#each images as image}
          <Image path={$imageTemplate.replace(IMAGE_PLACEHOLDER, image)} />
        {/each}
      </div>
    {/if}
    {#if reasoning}
      <Expander expanded={true}>
        {#snippet header()}
          <div class="title-xxs">
            {$_('answer.reasoning')}
          </div>
        {/snippet}
        <div class="reasoning-text">
          <MarkdownRendering text={reasoning} />
        </div>
      </Expander>
    {/if}
  {/if}
  {#if !answer.inError}
    {#if !$hideAnswer}
      <div class="actions">
        {#if !$chat[rank]?.answer.incomplete}
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
          {#if initialAnswer}
            <Button
              aspect="basic"
              size="small"
              on:click={() => dispatch('openChat')}>
              <span class="go-to-chat title-s">{$_('answer.chat-action')}</span>
            </Button>
          {/if}
        {/if}
      </div>
    {/if}
    {#if $isCitationsEnabled && !$hasNotEnoughData && !$disableRAG}
      <div class="sources-container">
        {#if sources.length > 0}
          {#if $hideAnswer}
            <div class="sources-list">
              <Sources
                {sources}
                answerRank={rank}
                selected={selectedCitation} />
            </div>
          {:else}
            <Expander expanded={$expandedCitations === undefined ? initialAnswer : $expandedCitations}>
              {#snippet header()}
                <div class="title-s">
                  {$_('answer.sources')}
                </div>
              {/snippet}
              <div class="sources-list">
                <Sources
                  {sources}
                  answerRank={rank}
                  selected={selectedCitation} />
              </div>
            </Expander>
          {/if}
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

<style src="./Answer.css"></style>
