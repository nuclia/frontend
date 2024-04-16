<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { _, chat, sendFeedback } from '../../core';
  import { Button, Dropdown } from '../../common';

  export let rank = 0;

  let approved: 'good' | 'bad' | '' = '';
  let button: HTMLElement | undefined;
  let position: { top: number, left: number, width: number } | undefined = undefined;
  let feedback = '';

  $: isGood = approved === 'good';
  $: isBad = approved === 'bad';

  function send(good: boolean, feedback?: string) {
    chat
      .pipe(
        take(1),
        switchMap((chat) => sendFeedback(chat[rank].answer, good, feedback)),
      )
      .subscribe(() => {
        approved = good ? 'good' : 'bad';
        closeDropdown();
      });
  }

  function openDropdown() {
    if (button) {
      const { top, left, height, ...rest } = button.getBoundingClientRect();
      const width = Math.min(window.innerWidth - left, 400);
      position = { top: top + height + 8, left, width };
    }
  }

  function closeDropdown() {
    position = undefined
  }

</script>

{#if !$chat[rank]?.answer.incomplete}
  <div class="sw-feedback">
    <IconButton
      aspect="basic"
      icon="thumb-up"
      size="small"
      active={isGood}
      kind={isGood ? 'primary' : 'secondary'}
      on:click={() => send(true)} />
    <div bind:this={button}>
      <IconButton
        aspect="basic"
        icon="thumb-down"
        size="small"
        active={isBad}
        kind={isBad ? 'primary' : 'secondary'}
        on:click={() => openDropdown()} />
      {#if position}
        <Dropdown
          {position}
          on:close={() => closeDropdown()}>
          <div class="dropdown">
            <div class="close">
              <IconButton
                aspect="basic"
                icon="cross"
                size="small"
                on:click={() => closeDropdown()} />
            </div>
            <textarea
              bind:value={feedback}
              rows="3"
              placeholder="{$_('answer.improve')}"></textarea>
            <div class="submit">
              <Button on:click={() => send(false, feedback)}>
                {$_('answer.submit-feedback')}
              </Button>
            </div>
          </div>
        </Dropdown>
      {/if}
    </div>
  </div>
{/if}

<style
  lang="scss"
  src="./Feedback.scss"></style>
