<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import { _ } from '../../core/i18n';
  import { firstAnswer, resetChat } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Chat from './Chat.svelte';
  import Feedback from './Feedback.svelte';

  let showDialog = false;

  function onClose() {
    showDialog = false;
    resetChat.set();
  }
</script>

{#if $firstAnswer.text}
  <div class="sw-initial-answer">
    <div class="answer">
      <Answer
        answer={$firstAnswer}
        rank={0} />
    </div>
    <div class="actions">
      <div
        class="go-to-chat"
        on:click={() => (showDialog = true)}>
        <Icon name="chat" />
        {$_('answer.chat-action')}
      </div>
      <div class="feedback">
        <Feedback rank={0} />
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
