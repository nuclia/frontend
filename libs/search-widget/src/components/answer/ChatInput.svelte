<script lang="ts">
  import { Subscription, filter } from 'rxjs';
  import { onMount } from 'svelte';
  import { SpeechSettings, SpeechStore } from 'talk2svelte';
  import { Icon, IconButton } from '../../common';
  import Textarea from '../../common/textarea/Textarea.svelte';
  import { chatInput, hasSearchButton, isSpeechEnabled, isSpeechOn } from '../../core';
  import { _, currentLanguage, translateInstant } from '../../core/i18n';
  import { ask } from '../../core/stores/effects';

  interface Props {
    placeholder?: string;
    fullscreen: any;
  }

  let { placeholder = '', fullscreen }: Props = $props();

  let inputElement: Textarea = $state();
  let question = $state('');
  let isListening = $state(false);

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
    subs.push(chatInput.subscribe((input: string) => (question = input)));
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
  {#if $isSpeechEnabled || $hasSearchButton}
    <div class="buttons">
      {#if $isSpeechEnabled}
        <IconButton
          icon="microphone"
          active={$isSpeechStarted}
          aspect="basic"
          on:click={toggleSpeech} />
      {/if}
      {#if $hasSearchButton}
        <IconButton
          icon="search"
          aspect="basic"
          on:click={askQuestion} />
      {/if}
    </div>
  {/if}
</div>
{#if $isSpeechStarted}
  <div class="body-xs">
    {$_('voice.help')}
  </div>
{/if}

<style src="./ChatInput.css"></style>
