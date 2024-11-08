<script lang="ts">
  import { switchMap, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import { _, chat, sendFeedback, type RankedParagraph } from '../../core';
  import { Button, Checkbox, Dropdown, isMobileViewport } from '../../common';

  export let rank = 0;
  export let paragraph: RankedParagraph | undefined = undefined;
  export let size: 'small' | 'xsmall' = 'small';

  let approved: 'good' | 'bad' | '' = '';
  let button: HTMLElement | undefined;
  let showDropdown = false;
  let position: { top?: number; bottom?: number; left: number; width: number } | undefined = undefined;
  let options = ['wrong-answer', 'wrong-citations', 'wrong-results'];
  let checked: { [key: string]: boolean } = {};
  let feedback = '';

  $: isGood = approved === 'good';
  $: isBad = approved === 'bad';

  function send(good: boolean) {
    chat
      .pipe(
        take(1),
        switchMap((chat) => sendFeedback(chat[rank].answer.id, good, good ? '' : getFeedback(), paragraph?.id)),
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
      const dropdownWidth = 400;
      const { top, left, height, width, ...rest } = button.getBoundingClientRect();
      const notEnoughSpace = left + dropdownWidth > window.innerWidth;
      position = isMobileViewport(window.innerWidth)
        ? { bottom: 0, left: 0, width: window.innerWidth }
        : { top: top + height + 8, left: notEnoughSpace ? left - 400 + width : left, width: dropdownWidth };
      showDropdown = true;
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
      {size}
      active={isGood}
      kind={isGood ? 'primary' : 'secondary'}
      on:click={() => send(true)} />
    <div bind:this={button}>
      <IconButton
        aspect="basic"
        icon="thumb-down"
        {size}
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
            {#if !paragraph}
              <div class="options">
                {#each options as option}
                  <Checkbox
                    checked={checked[option]}
                    on:change={(value) => {
                      checked[option] = !!value.detail;
                    }}>
                    <span class="body-m">{$_('answer.feedback.' + option)}</span>
                  </Checkbox>
                {/each}
              </div>
            {/if}
            <textarea
              bind:value={feedback}
              rows="3"
              placeholder={$_('answer.feedback.comments')}></textarea>
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
