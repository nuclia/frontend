<script lang="ts">
  import Answer from './Answer.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { chat } from '../../core/stores/answers.store';
  import ChatInput from './ChatInput.svelte';
  import { _ } from '../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { delay, distinctUntilChanged } from 'rxjs';
  import { IconButton } from '../../common';

  const dispatch = createEventDispatcher();
  let entriesContainerElement: HTMLDivElement;

  let isScrolling = false;

  onMount(() => {
    const sub = chat.pipe(delay(200), distinctUntilChanged()).subscribe(() => {
      entriesContainerElement.scrollTo({ top: entriesContainerElement.scrollHeight, behavior: 'smooth' });
    });
    return () => sub.unsubscribe();
  });

  function checkIfScrolling() {
    isScrolling =
      !!entriesContainerElement && entriesContainerElement.offsetHeight < entriesContainerElement.scrollHeight;
  }
</script>

<div class="sw-chat">
  <header>
    <IconButton
      icon="cross"
      aspect="basic"
      on:click={() => dispatch('close')} />
  </header>
  <div class="chat-container">
    <div
      class="entries-container"
      bind:this={entriesContainerElement}>
      {#each $chat as entry, i}
        <div class="chat-entry">
          <div class="question">
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

    <div
      class="input-container"
      class:scrolling-behind={isScrolling}>
      <ChatInput placeholder={$_('answer.placeholder')} />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./Chat.scss"></style>
