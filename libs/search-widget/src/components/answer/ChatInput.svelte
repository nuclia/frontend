<script lang="ts">
  import { Subscription, filter } from 'rxjs';
  import { onMount } from 'svelte';
  import { SpeechSettings, SpeechStore } from 'talk2svelte';
  import { Dropdown, Icon, IconButton } from '../../common';
  import Textarea from '../../common/textarea/Textarea.svelte';
  import { chatInput, hasFilterButton, hasFilters, hasSearchButton, isSpeechEnabled, isSpeechOn } from '../../core';
  import { _, currentLanguage, translateInstant } from '../../core/i18n';
  import SearchFilters from '../search-filters/SearchFilters.svelte';
  import SelectedFilters from '../search-filters/SelectedFilters.svelte';

  interface Props {
    placeholder?: string;
    fullscreen: any;
    disabled?: boolean;
    onChange: (text: string) => void
  }

  let { placeholder = '', fullscreen, disabled = false, onChange }: Props = $props();

  let inputElement: Textarea | undefined = $state();
  let question = $state('');
  let isListening = $state(false);
  let showFilterDropdowns = $state(false);
  let filterButtonElement: HTMLElement | undefined = $state();
  let filterDropdownPosition: { top?: number; bottom?: number; left: number; width: number } | undefined = $state();

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
    // ask.next({ question, reset: false });
    onChange(question);
    question = '';
    if ((navigator as any).userAgentData?.mobile) {
      // Make sure the keyboard disappear when triggering search in Mobile
      inputElement?.blur();
    }
  };

  const onKeyPress = (event: { detail: KeyboardEvent }) => {
    if (event.detail.key === 'Enter' && !!question) {
      event.detail.preventDefault();
      askQuestion();
    }
  };

  const clear = () => {
    question = '';
  };

  const toggleFilter = () => {
    setFilterDropdownPosition();
    showFilterDropdowns = !showFilterDropdowns;
  };

  const setFilterDropdownPosition = () => {
    if (filterButtonElement) {
      const width = 27 * 8;
      const maxHeight = 40 * 8;
      const buttonPosition = filterButtonElement.getBoundingClientRect();
      const canFitRight = buttonPosition.left + width < window.innerWidth;
      const canFitBottom = buttonPosition.bottom + maxHeight < window.innerHeight;
      const left = canFitRight ? buttonPosition.right + 16 : buttonPosition.right - width;
      if (canFitBottom) {
        filterDropdownPosition = { top: buttonPosition.bottom + 4, left, width };
      } else {
        filterDropdownPosition = { bottom: window.innerHeight - buttonPosition.top + 4, left, width };
      }
    }
  };
</script>

<div
  class="sw-chat-input"
  class:fullscreen
  class:highlight={isListening}>
  <div class="input-container">
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
      {disabled}
      ariaLabel={$_('answer.input.label')}
      bind:value={question}
      on:keypress={onKeyPress} />
    {#if $isSpeechEnabled || $hasSearchButton || $hasFilterButton}
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
        {#if $hasFilterButton}
          <div bind:this={filterButtonElement}>
            <IconButton
              icon="filter"
              aspect="basic"
              size="medium"
              active={showFilterDropdowns}
              on:click={toggleFilter} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
  {#if $hasFilters}
    <div class="filters-container">
      <SelectedFilters></SelectedFilters>
    </div>
  {/if}
</div>
{#if $isSpeechStarted}
  <div class="body-xs">
    {$_('voice.help')}
  </div>
{/if}
{#if showFilterDropdowns}
  <Dropdown
    position={filterDropdownPosition}
    on:close={() => (showFilterDropdowns = false)}>
    <SearchFilters />
  </Dropdown>
{/if}

<style src="./ChatInput.css"></style>
