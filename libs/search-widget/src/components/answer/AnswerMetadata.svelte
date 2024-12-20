<script lang="ts">
  import { _ } from '../../core/i18n';
  import { Expander, IconButton, Modal } from '../../common';
  import { MarkdownRendering } from '../viewer';
  import type { Ask } from '@nuclia/core';

  export let answer: Partial<Ask.Answer>;
  export let show = false;
</script>

<div class="sw-answer-metadata">
  <Modal
    {show}
    on:close={() => {
      show = false;
    }}>
    <div class="dialog-content">
      <div class="close-button">
        <IconButton
          icon="cross"
          aspect="basic"
          on:click={() => {
            show = false;
          }} />
      </div>
      <div>
        <div class="title-m">{$_('answer.metadata.title')}</div>
        <table class="body-m">
          {#if answer?.metadata?.tokens}
            <tr>
              <td>Input Nuclia tokens</td>
              <td class="title-s">{answer.metadata.tokens.input_nuclia}</td>
            </tr>
            <tr>
              <td>Output Nuclia tokens</td>
              <td class="title-s">{answer.metadata.tokens.output_nuclia}</td>
            </tr>
          {/if}
          {#if answer?.metadata?.timings}
            <tr>
              <td>{$_('answer.metadata.total-time')}</td>
              <td class="title-s">
                {answer.metadata.timings.generative_total?.toFixed(3)}
                {$_('answer.metadata.seconds')}
              </td>
            </tr>
            <tr>
              <td>{$_('answer.metadata.first-word-time')}</td>
              <td class="title-s">
                {answer.metadata.timings.generative_first_chunk?.toFixed(3)}
                {$_('answer.metadata.seconds')}
              </td>
            </tr>
          {/if}
        </table>
      </div>
      {#if answer?.promptContext}
        <div>
          <div class="title-m">Prompt context</div>
          <p class="body-m">
            {$_('answer.metadata.prompt-context')}
          </p>
          <div class="expander-container">
            <Expander expanded={false}>
              <div
                class="title-s"
                slot="header">
                {$_('answer.metadata.text-blocks')}
              </div>
              <div class="context-list">
                {#each answer.promptContext as text}
                  <div class="context-item body-m">
                    <MarkdownRendering {text} />
                  </div>
                {/each}
              </div>
            </Expander>
          </div>
        </div>
      {/if}
    </div>
  </Modal>
</div>

<style
  lang="scss"
  src="./AnswerMetadata.scss"></style>
