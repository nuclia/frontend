<script lang="ts">
  import { _ } from '../../core/i18n';
  import { firstAnswer, hideAnswer, reinitChat } from '../../core/stores/answers.store';
  import { trackingEngagement } from '../../core/stores/search.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';

  let showChat = $state(false);

  function openChat() {
    showChat = true;
    trackingEngagement.set({ type: 'CHAT' });
  }
  function onClose() {
    showChat = false;
    reinitChat.set();
  }
</script>

{#if $firstAnswer.text || $firstAnswer.reasoning || $firstAnswer.inError}
  <div class="sw-initial-answer">
    {#if !$hideAnswer}
      <h3 class="title-s">{$_('answer.title')}</h3>
    {/if}
    <Answer
      answer={$firstAnswer}
      rank={0}
      initialAnswer={true}
      on:openChat={openChat} />
  </div>
{/if}

<Chat
  show={showChat}
  on:close={onClose} />

<style src="./InitialAnswer.css"></style>
