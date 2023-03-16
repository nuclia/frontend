<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { sendFeedback } from '../../core/api';
  import { dialog } from '../../core/stores/answers.store';

  export let rank = 0;

  function send(approved: boolean) {
    dialog
      .pipe(
        take(1),
        switchMap((dialog) => sendFeedback(dialog.slice(0, rank + 1), approved)),
      )
      .subscribe();
  }
</script>

<IconButton
  aspect="basic"
  icon="smiley-happy"
  on:click={() => send(true)} />
<IconButton
  aspect="basic"
  icon="smiley-sad"
  on:click={() => send(false)} />
