<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { _, chat, sendFeedback } from '../../core';
  import { Button, Checkbox, Dropdown } from '../../common';

  export let rank = 0;

  let approved: 'good' | 'bad' | '' = '';
  let button: HTMLElement | undefined;
  let showDropdown = false;
  let position: { top: number, left: number, width: number } | undefined = undefined;
  let options = ['wrong-answer', 'wrong-citations', 'wrong-results'];
  let checked: { [key: string]: boolean } = {};
  let feedback = '';

  $: isGood = approved === 'good';
  $: isBad = approved === 'bad';

  function send(good: boolean) {
    chat
      .pipe(
        take(1),
        switchMap((chat) => sendFeedback(chat[rank].answer, good, good ? '' : getFeedback())),
      )
      .subscribe(() => {
        approved = good ? 'good' : 'bad';
        closeDropdown();
      });
  }

  function getFeedback() {
    return Object.entries(checked)
      .filter(([, checked]) => checked)
      .map(([option]) => $_(`answer.feedback.${option}`))
      .concat(feedback)
      .join('. ');
  }

  function openDropdown() {
    if (button) {
      const { top, left, height, ...rest } = button.getBoundingClientRect();
      const width = Math.min(window.innerWidth - left, 400);
      showDropdown = true;
      position = { top: top + height + 8, left, width };
    }
  }

  function closeDropdown() {
    showDropdown = false;
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
        active={isBad || showDropdown}
        kind={isBad ? 'primary' : 'secondary'}
        on:click={() => openDropdown()} />
      {#if showDropdown}
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
            <div class="options">
              {#each options as option}
                <Checkbox
                  checked={checked[option]}
                  on:change={(value) => {checked[option] = !!value.detail}}>
                  <span class="body-m">{$_('answer.feedback.' + option)}</span>
                </Checkbox>
              {/each}
            </div>
            <textarea
              bind:value={feedback}
              rows="3"
              placeholder="{$_('answer.feedback.comments')}"></textarea>
            <div class="submit">
              <Button on:click={() => send(false)}>
                {$_('answer.feedback.submit')}
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
