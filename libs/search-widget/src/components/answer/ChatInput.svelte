<script lang="ts">
  import Textarea from '../../common/textarea/Textarea.svelte';
  import { Icon, IconButton } from '../../common';
  import { _, currentLanguage, translateInstant } from '../../core/i18n';
  import { ask } from '../../core/stores/effects';
  import { isSpeechEnabled, isSpeechOn } from '../../core';
  import { SpeechSettings, SpeechStore } from 'talk2svelte';
  import { Subscription, filter } from 'rxjs';
  import { onMount } from 'svelte';

  export let placeholder = '';
  export let fullscreen;

  let inputElement: Textarea;
  let question = '';
  let isListening = false;

  const subs: Subscription[] = [];
  const isSpeechStarted = SpeechStore.isStarted;
  const questionCommand = translateInstant('voice.commands.question');
  const answerCommand = translateInstant('voice.commands.answer');

  function toggleSpeech() {
    isSpeechOn.set({ toggle: true });
  }

  onMount(() => {
    subs.push(
      isSpeechEnabled.subscribe((enabled) => {
        if (enabled) {
          SpeechSettings.declareCommand(questionCommand);
          SpeechSettings.declareCommand(answerCommand);
          SpeechSettings.setLang(currentLanguage.getValue(), false);
        }
      }),
    );
    subs.push(
      SpeechStore.currentCommand
        .pipe(filter((command) => command === questionCommand))
        .subscribe(() => (isListening = true)),
    );
    subs.push(
      SpeechStore.currentCommand.pipe(filter((command) => command === answerCommand)).subscribe(() => {
        isListening = false;
        askQuestion();
      }),
    );
    subs.push(SpeechStore.message.pipe(filter(() => isListening)).subscribe((message: string) => (question = message)));
    return () => {
      SpeechSettings.removeCommand(questionCommand);
      SpeechSettings.removeCommand(answerCommand);
      subs.map((sub) => sub.unsubscribe());
    };
  });

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

  const clear = () => {
    question = '';
  };
</script>

<div
  class="sw-chat-input"
  class:fullscreen
  class:highlight={isListening}>
  {#if question.length === 0}
    <div class="chat-icon">
      <Icon name="chat" />
    </div>
  {:else}
    <div class="clear">
      <IconButton
        aspect="basic"
        icon="cross"
        ariaLabel={$_('input.clear')}
        size="small"
        on:click={clear} />
    </div>
  {/if}
  <Textarea
    name="nuclia-chat-field"
    bind:this={inputElement}
    {placeholder}
    ariaLabel={$_('answer.input.label')}
    bind:value={question}
    on:keypress={onKeyPress} />
  {#if $isSpeechEnabled}
    <div class="microphone">
      <IconButton
        icon="microphone"
        active={$isSpeechStarted}
        aspect="basic"
        on:click={toggleSpeech} />
    </div>
  {/if}
</div>
{#if $isSpeechStarted}
  <div class="body-xs">
    {$_('voice.help')}
  </div>
{/if}

<style
  lang="scss"
  src="./ChatInput.scss"></style>
