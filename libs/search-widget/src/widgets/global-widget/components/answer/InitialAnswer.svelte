<script lang="ts">
  import { _ } from '../../../../core/i18n';
  import { firstAnswer } from '../../../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Feedback from './Feedback.svelte';
</script>

{#if $firstAnswer.text || $firstAnswer.inError}
  <div class="sw-initial-answer">
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
  </div>
{/if}

<style src="./InitialAnswer.css"></style>
