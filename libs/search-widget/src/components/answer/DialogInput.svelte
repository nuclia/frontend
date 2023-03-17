<script lang="ts">
  import Icon from '../../common/icons/Icon.svelte';
  import { ask } from '../../core/stores/effects';
  export let placeholder = '';

  let inputElement: HTMLInputElement;
  let question = '';

  const askQuestion = () => {
    ask.next(question);
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

<div class="sw-dialog-input">
  <div class="icon">
    <Icon name="chat" />
  </div>
  <input
    name="nuclia-dialog-field"
    bind:this={inputElement}
    {placeholder}
    tabindex="0"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label="Dialog input"
    bind:value={question}
    on:keypress={onKeyPress} />
</div>

<style
  lang="scss"
  src="./DialogInput.scss"></style>
