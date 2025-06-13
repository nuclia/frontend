<script lang="ts">
  import type { Ask } from '@nuclia/core';
  import { Expander, IconButton, Modal } from '../../common';
  import { _ } from '../../core/i18n';
  import { MarkdownRendering } from '../viewer';

  export let answer: Partial<Ask.Answer> | undefined = undefined;
  export let rephrasedQuery = '';
  export let show = false;
</script>

<div class="sw-debug-info">
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

      {#if rephrasedQuery}
        <div>
          <div class="title-m">{$_('answer.debug.rephrase')}</div>
          <table class="body-m">
            <tbody>
              <tr>
                <td>{$_('answer.debug.rephrased-query')}</td>
                <td class="title-s">
                  {rephrasedQuery}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}

      {#if answer?.metadata?.tokens || answer?.metadata?.timings}
        <div>
          <div class="title-m">{$_('answer.debug.title')}</div>
          <table class="body-m">
            <tbody>
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
                  <td>{$_('answer.debug.total-time')}</td>
                  <td class="title-s">
                    {answer.metadata.timings.generative_total?.toFixed(3)}
                    {$_('answer.debug.seconds')}
                  </td>
                </tr>
                <tr>
                  <td>{$_('answer.debug.first-word-time')}</td>
                  <td class="title-s">
                    {answer.metadata.timings.generative_first_chunk?.toFixed(3)}
                    {$_('answer.debug.seconds')}
                  </td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      {/if}

      {#if answer?.promptContext}
        <div>
          <div class="title-m">Prompt context</div>
          <p class="body-m">
            {$_('answer.debug.prompt-context')}
          </p>
          <div class="expander-container">
            <Expander expanded={false}>
              {#snippet header()}
                <div class="title-s">
                  {$_('answer.debug.text-blocks')}
                </div>
              {/snippet}
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

<style src="./DebugInfo.css"></style>
