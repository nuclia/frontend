<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import { _ } from '../../core/i18n';
  import { firstAnswer, resetChat } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';
  import Feedback from './Feedback.svelte';
  import { Button } from '../../common';

  let showDialog = false;

  function onClose() {
    showDialog = false;
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
          rank={0} />
      </div>
      <div class="actions">
        <Button
          aspect="basic"
          on:click={() => (showDialog = true)}>
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

<Modal
  show={showDialog}
  closeButton={true}
  on:close={onClose}>
  <Chat />
</Modal>

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
