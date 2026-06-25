<script lang="ts">
  import { tick } from 'svelte';
  import { switchMap, take } from 'rxjs';
  import { Button, Checkbox, Dropdown, isMobileViewport } from '../../common';
  import IconButton from '../../common/button/IconButton.svelte';
  import { _, chat, sendFeedback, type RankedParagraph } from '../../core';

  interface Props {
    rank?: number;
    paragraph?: RankedParagraph | undefined;
    size?: 'small' | 'xsmall';
  }

  let { rank = 0, paragraph = undefined, size = 'small' }: Props = $props();

  let approved: 'good' | 'bad' | '' = $state('');
  let button: HTMLElement | undefined = $state();
  let dropdownEl: HTMLElement | undefined = $state();
  let previouslyFocused: Element | null = null;
  let showDropdown = $state(false);
  let position: { top?: number; bottom?: number; left: number; width: number } | undefined = $state(undefined);
  let options = ['wrong-answer', 'wrong-citations', 'wrong-results'];
  let checked: { [key: string]: boolean } = $state({});
  let feedback = $state('');

  let isGood = $derived(approved === 'good');
  let isBad = $derived(approved === 'bad');

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

  async function openDropdown() {
    if (button) {
      const dropdownWidth = 400;
      const { top, left, height, width, ...rest } = button.getBoundingClientRect();
      const notEnoughSpace = left + dropdownWidth > window.innerWidth;
      position = isMobileViewport(window.innerWidth)
        ? { bottom: 0, left: 0, width: window.innerWidth }
        : { top: top + height + 8, left: notEnoughSpace ? left - 400 + width : left, width: dropdownWidth };
      previouslyFocused = document.activeElement;
      showDropdown = true;
      await tick();
      const focusable = dropdownEl?.querySelector<HTMLElement>(
        'button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }
  }

  function closeDropdown() {
    showDropdown = false;
    (previouslyFocused as HTMLElement)?.focus();
    previouslyFocused = null;
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
      ariaLabel={$_('answer.feedback.good')}
      on:click={() => send(true)} />
    <div bind:this={button}>
      <IconButton
        aspect="basic"
        icon="thumb-down"
        {size}
        active={isBad || showDropdown}
        kind={isBad ? 'primary' : 'secondary'}
        ariaLabel={$_('answer.feedback.bad')}
        on:click={() => openDropdown()} />
      {#if showDropdown}
        <Dropdown
          {position}
          on:close={() => closeDropdown()}>
          <div class="dropdown" bind:this={dropdownEl}>
            <div class="close">
              <IconButton
                aspect="basic"
                icon="cross"
                size="small"
                ariaLabel={$_('answer.feedback.close')}
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
              placeholder={$_('answer.feedback.comments')}>
            </textarea>
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

<style src="./Feedback.css"></style>
