<script lang="ts">
  import type { Ask } from '@nuclia/core';
  import { Expander, IconButton, Modal } from '../../common';
  import { _ } from '../../core/i18n';
  import { MarkdownRendering } from '../viewer';
  import { routedConfig, routingParam } from '../../core';

  interface Props {
    answer?: Partial<Ask.Answer>;
    rephrasedQuery?: string;
    show?: boolean;
  }

  let { answer, rephrasedQuery = '', show = $bindable(false) }: Props = $props();

  let tokens = $derived(
    answer?.consumption && answer.consumption.normalized_tokens.input > 0
      ? answer.consumption.normalized_tokens
      : answer?.consumption?.customer_key_tokens,
  );
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

      {#if $routingParam}
        <div>
          <div class="title-m">{$_('answer.debug.routing')}</div>
          <table class="body-m">
            <tbody>
              <tr>
                <td>{$_('answer.debug.routed-config')}</td>
                <td class="title-s">
                  {$routedConfig}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}

      {#if tokens || answer?.metadata?.timings}
        <div>
          <div class="title-m">{$_('answer.debug.title')}</div>
          <table class="body-m">
            <tbody>
              {#if tokens}
                <tr>
                  <td>Input tokens</td>
                  <td class="title-s">{tokens.input}</td>
                </tr>
                <tr>
                  <td>Output tokens</td>
                  <td class="title-s">{tokens.output}</td>
                </tr>
                {#if tokens.image > 0}
                  <tr>
                    <td>Image tokens</td>
                    <td class="title-s">{tokens.image}</td>
                  </tr>
                {/if}
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
