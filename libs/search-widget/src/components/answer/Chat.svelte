<script lang="ts">
  import { delay, distinctUntilChanged, filter } from 'rxjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import { freezeBackground, Icon, IconButton, LoadingDots, unblockBackground } from '../../common';
  import Button from '../../common/button/Button.svelte';
  import {
    _,
    chat,
    chatPlaceholderDiscussion,
    chatPlaceholderInitial,
    hasChatEntries,
    isReasoning,
    isStreaming,
    resetChat,
  } from '../../core';
    import { ask } from '../../core/stores/effects';
  import Answer from './Answer.svelte';
  import ChatInput from './ChatInput.svelte';

  interface Props {
    fullscreen?: boolean;
    show?: any;
    height: any;
    standaloneChat?: boolean;
  }

  let { fullscreen = true, show = !fullscreen, height, standaloneChat = false }: Props = $props();

  $effect(() => {
    if (fullscreen) {
      if (show) {
        freezeBackground(true);
      } else {
        unblockBackground(true);
      }
    }
  });

  const dispatch = createEventDispatcher();
  let entriesContainerElement: HTMLDivElement | undefined = $state();

  let isScrolling = $state(false);

  function onInput(question: string) {
    ask.next({ question, reset: false })
  }

  onMount(() => {
    const sub = chat
      .pipe(
        delay(200),
        distinctUntilChanged(),
        filter(() => show),
      )
      .subscribe(() => {
        if (entriesContainerElement) {
          entriesContainerElement.scrollTo({
            top: (entriesContainerElement.lastElementChild as HTMLElement)?.offsetTop,
            behavior: 'smooth',
          });
        }
      });
    return () => sub.unsubscribe();
  });

  function checkIfScrolling() {
    isScrolling =
      !!entriesContainerElement && entriesContainerElement.offsetHeight < entriesContainerElement.scrollHeight;
  }

  function resetConversation() {
    resetChat.set();
  }
</script>

{#if show}
  <div
    class="sw-chat"
    class:fullscreen>
    {#if fullscreen}
      <header>
        <IconButton
          icon="cross"
          aspect="basic"
          on:click={() => dispatch('close')} />
      </header>
    {/if}
    <div
      class="chat-container"
      class:fullscreen
      style={!fullscreen && height ? '--custom-height-container:' + height : undefined}>
      <div
        class="entries-container"
        class:hidden={$chat.length === 0}
        bind:this={entriesContainerElement}>
        {#each $chat as entry, i}
          <div class="chat-entry">
            <div
              class="question"
              class:error={entry.answer.inError}>
              <div class="chat-icon">
                <Icon name="chat" />
              </div>
              <div class="title-m">{entry.question}</div>
            </div>
            <div class="answer">
              {#if entry.answer.text || entry.answer.reasoning || entry.answer.inError}
                <Answer
                  answer={entry.answer}
                  rank={i}
                  on:toggleExpander={checkIfScrolling} />
              {:else}
                …
              {/if}
            </div>
          </div>
        {/each}
      </div>
      {#if $isStreaming}
        <LoadingDots label={$isReasoning ? $_('answer.reasoning') + '…' : ''} />
      {/if}
      <div
        class="input-container"
        class:scrolling-behind={isScrolling}>
        <ChatInput
          placeholder={$_($hasChatEntries ? $chatPlaceholderDiscussion : $chatPlaceholderInitial)}
          disabled={$isStreaming}
          {fullscreen} onChange={onInput}/>
        {#if standaloneChat}
          <div class="reset-button">
            <Button
              aspect="basic"
              disabled={!$hasChatEntries}
              size="small"
              on:click={resetConversation}>
              {$_('answer.reset')}
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style src="./Chat.css"></style>
