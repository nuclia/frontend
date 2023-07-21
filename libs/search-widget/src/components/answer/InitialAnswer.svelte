<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { chatError, firstAnswer, isServiceOverloaded, resetChat } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';
  import Feedback from './Feedback.svelte';
  import { Button } from '../../common';
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
      {#if $isServiceOverloaded}
        {$_('error.service-overloaded')}
      {:else if $chatError.status === 402}
        {$_('error.answer-feature-blocked')}
      {:else}
        {$_('error.search')}
      {/if}
    {:else}
      <div class="container">
        <div class="actions">
          <Button
            aspect="basic"
            size="small"
            on:click={openChat}>
            <span class="go-to-chat">
              <Icon name="chat" />
              {$_('answer.chat-action')}
            </span>
          </Button>
          <div class="feedback">
            <Feedback rank={0} />
          </div>
        </div>
        <div class="answer">
          <Answer
            answer={$firstAnswer}
            rank={0}
            hideFeedback={true} />
        </div>
      </div>
    {/if}
  </div>
{/if}

<Chat
  show={showChat}
  on:close={onClose} />

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
