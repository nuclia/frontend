<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { ask } from '../../core/stores/effects';

  export let placeholder = '';

  let inputElement: HTMLInputElement;
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

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      askQuestion();
    }
  };
</script>

<div
  class="sw-chat-input"
  class:highlight={isListening}>
  <div class="icon">
    <Icon name="chat" />
  </div>
  <input
    name="nuclia-chat-field"
    bind:this={inputElement}
    {placeholder}
    tabindex="0"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={$_('answer.input.label')}
    bind:value={question}
    on:keypress={onKeyPress} />
</div>

<style
  lang="scss"
  src="./ChatInput.scss"></style>
