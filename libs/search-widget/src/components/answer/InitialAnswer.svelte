<script lang="ts">
  import { _ } from '../../core/i18n';
  import { chatError, firstAnswer, isServiceOverloaded, resetChat } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';
  import { trackingEngagement } from '../../core/stores/search.store';

  let showChat = false;

  function openChat() {
    showChat = true;
    trackingEngagement.set({ type: 'CHAT' });
  }
  function onClose() {
    showChat = false;
    resetChat.set();
  }
</script>

{#if $firstAnswer.text || $chatError}
  <div class="sw-initial-answer">
    {#if $chatError}
      <strong>
        {#if $isServiceOverloaded}
          {$_('error.service-overloaded')}
        {:else if $chatError.status === 402}
          {$_('error.answer-feature-blocked')}
        {:else}
          {$_('error.search')}
        {/if}
      </strong>
    {:else}
      <h3 class="title-s">{$_('answer.title')}</h3>
      <Answer
        answer={$firstAnswer}
        rank={0}
        initialAnswer={true}
        on:openChat={openChat} />
    {/if}
  </div>
{/if}

<Chat
  show={showChat}
  on:close={onClose} />

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
