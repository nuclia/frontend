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
    collapseTextBlocks,
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
  let expandedSources = $derived($expandedCitations === undefined ? initialAnswer : $expandedCitations);

  const dispatch = createEventDispatcher();

  const IMAGE_PLACEHOLDER = '__IMAGE_PATH__';
  const imageTemplate = getAttachedImageTemplate(IMAGE_PLACEHOLDER);

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

  function onAnswerClick(event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.classList?.contains('ref')) {
      scrollToReference(parseInt(target.textContent));
    }
  }

  function scrollToReference(ref: number) {
    const delay = !expandedSources || $collapseTextBlocks ? 300 : 10;
    expandedSources = true;
    selectedCitation = ref - 1;

    // Wait until all expanders are expanded
    setTimeout(() => {
      const paragraph = element?.querySelector(`[data-scroll-ref="${ref}"]`);
      paragraph?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, delay);
  }

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
      <div
        class="answer-text"
        on:click={onAnswerClick}>
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
            <Expander bind:expanded={expandedSources}>
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
