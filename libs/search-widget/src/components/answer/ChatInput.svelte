<script lang="ts">
  import Textarea from '../../common/textarea/Textarea.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { ask } from '../../core/stores/effects';

  export let placeholder = '';
  export let fullscreen;

  let inputElement: Textarea;
  let question = '';
  let isListening = false;

  const askQuestion = () => {
    ask.next({ question, reset: false });
    question = '';
    if ((navigator as any).userAgentData?.mobile) {
      // Make sure the keyboard disappear when triggering search in Mobile
      inputElement.blur();
    }
  };

  const onKeyPress = (event: { detail: KeyboardEvent }) => {
    if (event.detail.key === 'Enter') {
      event.detail.preventDefault();
      askQuestion();
    }
  };
</script>

<div
  class="sw-chat-input"
  class:fullscreen
  class:highlight={isListening}>
  <div class="icon">
    <Icon name="chat" />
  </div>
  <Textarea
    name="nuclia-chat-field"
    bind:this={inputElement}
    {placeholder}
    ariaLabel={$_('answer.input.label')}
    bind:value={question}
    on:keypress={onKeyPress} />
</div>

<style
  lang="scss"
  src="./ChatInput.scss"></style>
