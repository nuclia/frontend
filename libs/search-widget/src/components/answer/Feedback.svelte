<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { sendFeedback } from '../../core/api';
  import { chat } from '../../core/stores/answers.store';

  export let rank = 0;

  function send(approved: boolean) {
    chat
      .pipe(
        take(1),
        switchMap((chat) => sendFeedback(chat.slice(0, rank + 1), approved)),
      )
      .subscribe();
  }
</script>

{#if !$chat[rank]?.answer.incomplete}
  <IconButton
    aspect="basic"
    icon="smiley-happy"
    on:click={() => send(true)} />
  <IconButton
    aspect="basic"
    icon="smiley-sad"
    on:click={() => send(false)} />
{/if}
