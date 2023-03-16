<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import { _ } from '../../core/i18n';
  import { firstAnswer, isStreaming } from '../../core/stores/answers.store';
  import Answer from './Answer.svelte';
  import Dialog from './Dialog.svelte';
  import Feedback from './Feedback.svelte';

  let showDialog = false;
</script>

{#if $firstAnswer.text}
  <div class="container">
    <div class="answer"><Answer answer={$firstAnswer} /></div>
    <div class="actions">
      <div
        class="go-to-dialog"
        on:click={() => (showDialog = true)}>
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

<Modal
  show={showDialog}
  closeButton={true}>
  <Dialog />
</Modal>

<style
  lang="scss"
  src="./InitialAnswer.scss"></style>
