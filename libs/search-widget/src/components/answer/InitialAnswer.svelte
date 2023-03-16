<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { firstAnswer, isStreaming } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Feedback from './Feedback.svelte';
</script>

{#if $firstAnswer.text}
  <div class="container">
    <div class="answer"><Answer answer={$firstAnswer} /></div>
    <div class="actions">
      <div>
        <Icon name="chat" />
        {$_('answer.chat-action')}
      </div>
      {#if !$isStreaming}
        <div>
          <Feedback rank={0} />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
