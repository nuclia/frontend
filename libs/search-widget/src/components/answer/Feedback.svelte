<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { sendFeedback } from '../../core/api';
  import { chat } from '../../core/stores/answers.store';

  export let rank = 0;

  let approved: 'good' | 'bad' | '' = '';

  $: isGood = approved === 'good';
  $: isBad = approved === 'bad';

  function send(good: boolean) {
    chat
      .pipe(
        take(1),
        switchMap((chat) => sendFeedback(chat[rank].answer, good)),
      )
      .subscribe(() => (approved = good ? 'good' : 'bad'));
  }
</script>

{#if !$chat[rank]?.answer.incomplete}
  <IconButton
    aspect="basic"
    icon="smiley-happy"
    active={isGood}
    kind={isGood ? 'primary' : 'secondary'}
    on:click={() => send(true)} />
  <IconButton
    aspect="basic"
    icon="smiley-sad"
    active={isBad}
    kind={isBad ? 'primary' : 'secondary'}
    on:click={() => send(false)} />
{/if}
