<script lang="ts">
  import { _ } from '../../../../core/i18n';
  import { chatError, firstAnswer, isServiceOverloaded } from '../../../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Feedback from './Feedback.svelte';
</script>

{#if $firstAnswer.text || $chatError}
  <div class="sw-initial-answer">
    {#if $chatError}
      {#if $isServiceOverloaded}
        {$_('error.service-overloaded')}
      {:else if $chatError.status === 402}
        {$_('error.answer-feature-blocked')}
      {:else}
        {$_('error.search')}
      {/if}
    {:else}
      <div class="container">
        <div class="answer">
          <Answer
            answer={$firstAnswer}
            rank={0}
            hideFeedback={true} />
        </div>
        <div class="actions">
          <div class="feedback">
            <Feedback rank={0} />
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style src="./InitialAnswer.css"></style>
