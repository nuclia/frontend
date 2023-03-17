<script lang="ts">
  import Answer from './Answer.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { dialog } from '../../core/stores/answers.store';
  import Feedback from './Feedback.svelte';
  import DialogInput from './DialogInput.svelte';
  import { _ } from '../../core/i18n';
  import { onMount } from 'svelte';
  import { delay } from 'rxjs';

  let entriesElement: HTMLDivElement;
  onMount(() => {
    const sub = dialog.pipe(delay(200)).subscribe(() => {
      entriesElement.scrollTo({ top: entriesElement.scrollHeight, behavior: 'smooth' });
    });
    return () => sub.unsubscribe();
  });
</script>

<div class="sw-dialog">
  <div
    class="entries"
    bind:this={entriesElement}>
    {#each $dialog as entry, i}
      <div class="entry">
        <div class="row-1">
          <div class="icon">
            <Icon name="chat" />
          </div>
          <h3 class="title-m">{entry.question}</h3>
        </div>
        <div class="row-2">
          <div class="answer">
            {#if entry.answer.text}
              <Answer
                answer={entry.answer}
                rank={i} />
            {:else}
              …
            {/if}
          </div>
          <div class="feedback">
            <Feedback rank={i} />
          </div>
        </div>
      </div>
    {/each}
  </div>
  <div class="input">
    <div />
    <DialogInput placeholder={$_('answer.placeholder')} />
  </div>
</div>

<style
  lang="scss"
  src="./Dialog.scss"></style>
