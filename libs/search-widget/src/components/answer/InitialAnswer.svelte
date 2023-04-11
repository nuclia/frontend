<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { firstAnswer, resetChat } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';
  import Feedback from './Feedback.svelte';
  import { Button } from '../../common';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';

  let showChat = false;

  function openChat() {
    showChat = true;
    freezeBackground(true);
  }
  function onClose() {
    showChat = false;
    unblockBackground(true);
    resetChat.set();
  }
</script>

{#if $firstAnswer.text}
  <div class="sw-initial-answer">
    <h3 class="title-s">{$_('answer.title')}</h3>
    <div class="container">
      <div class="answer">
        <Answer
          answer={$firstAnswer}
          rank={0}
          hideFeedback={true} />
      </div>
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
    </div>
  </div>
{/if}

{#if showChat}
  <Chat on:close={onClose} />
{/if}

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
