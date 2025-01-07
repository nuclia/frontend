<script lang="ts">
  import Answer from './Answer.svelte';
  import { _, chat, chatPlaceholder, hasChatEntries, isStreaming, resetChat } from '../../core';
  import ChatInput from './ChatInput.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import { delay, distinctUntilChanged, filter } from 'rxjs';
  import { freezeBackground, Icon, IconButton, LoadingDots, unblockBackground } from '../../common';
  import Button from '../../common/button/Button.svelte';

  export let fullscreen = true;
  export let show = !fullscreen;
  export let height;
  export let standaloneChat = false;

  $: {
    if (fullscreen) {
      show ? freezeBackground(true) : unblockBackground(true);
    }
  }

  const dispatch = createEventDispatcher();
  let entriesContainerElement: HTMLDivElement;

  let isScrolling = false;

  onMount(() => {
    const sub = chat
      .pipe(
        delay(200),
        distinctUntilChanged(),
        filter(() => show),
      )
      .subscribe(() => {
        entriesContainerElement.scrollTo({
          top: (entriesContainerElement.lastElementChild as HTMLElement)?.offsetTop,
          behavior: 'smooth',
        });
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
      {#if $chat.length > 0}
        <div
          class="entries-container"
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
                {#if entry.answer.text}
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
      {/if}
      {#if $isStreaming}
        <LoadingDots />
      {/if}
      <div
        class="input-container"
        class:scrolling-behind={isScrolling}>
        <ChatInput
          placeholder={$_($chatPlaceholder)}
          {fullscreen} />
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

<style
  lang="scss"
  src="./Chat.scss"></style>
