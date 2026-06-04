<script lang="ts">
  import type { Feedback } from '@nuclia/core';
  import { getFeedbackFields } from '../../core';
  import { _ } from '../../core/i18n';
  import Button from '../../common/button/Button.svelte';

  interface Props {
    feedback: Feedback;
    onSubmit: (requestId: string, data: any) => void;
  }

  let { feedback, onSubmit }: Props = $props();

  let data = $state<{ [field: string]: any }>({});
  let fields = $derived(getFeedbackFields(feedback));
  let disabled = $derived((fields?.required || []).some((field) => !data[field]?.trim()));

  $effect(() => {
    // Init form
    if (feedback && fields) {
      data = Object.fromEntries(Object.keys(fields.fields).map((key) => [key, '']));
    }
  });
</script>

<div
  class="sw-arag-feedback"
  class:error={!fields}>
  {#if fields}
    <div class="title-s">{feedback.question}</div>
    {#each Object.entries(fields.fields) as [key, field]}
      <div>
        <label
          class="body-s"
          for={feedback.feedback_id + '-' + key}>
          {field?.title || key}
        </label>
        <input
          id={feedback.feedback_id + '-' + key}
          type="text"
          bind:value={data[key]} />
      </div>
    {/each}
    <Button
      on:click={() => onSubmit(feedback.request_id, data)}
      {disabled}>
      {$_('generic.submit')}
    </Button>
  {:else}
    <div class="title-s">{$_('answer.unsupported-form')}</div>
    <Button on:click={() => onSubmit(feedback.request_id, {})}>
      {$_('generic.continue')}
    </Button>
  {/if}
</div>

<style src="./AragFeedback.css"></style>
