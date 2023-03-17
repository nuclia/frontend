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
        <div class="row">
          <div class="icon">
            <Icon name="chat" />
          </div>
          <h3 class="title-m">{entry.question}</h3>
          <div />
        </div>
        <div class="row">
          <div />
          {#if entry.answer.text}
            <Answer answer={entry.answer} />
          {:else}
            <div>…</div>
          {/if}
          <div>
            {#if !entry.answer.incomplete}
              <Feedback rank={i} />
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
  <div class="row input">
    <div />
    <DialogInput placeholder={$_('answer.placeholder')} />
  </div>
</div>

<style
  lang="scss"
  src="./Dialog.scss"></style>
