import { mount, tick, unmount } from 'svelte';
import { vi } from 'vitest';
import { chatInput } from '../../core';
import { widgetFeatures } from '../../core/stores/widget.store';
import ChatInput from './ChatInput.svelte';

describe('Chat composer submit', () => {
  let component: ReturnType<typeof mount>;
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    widgetFeatures.set({ displaySearchButton: true, chatSubmitButton: true });
    chatInput.set('');
    onChange = vi.fn();
    component = mount(ChatInput, {
      target: document.body,
      props: { fullscreen: false, onChange },
    });
    await tick();
  });

  afterEach(async () => {
    await unmount(component);
    widgetFeatures.set(null);
    chatInput.set('');
  });

  function submitButton() {
    const button = document.querySelector<HTMLButtonElement>('.submit button');
    if (!button) {
      throw new Error('Submit button was not rendered');
    }
    return button;
  }

  function input() {
    const textarea = document.querySelector('textarea');
    if (!textarea) {
      throw new Error('Chat textarea was not rendered');
    }
    return textarea;
  }

  async function type(value: string) {
    const textarea = input();
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    return textarea;
  }

  it('stays visible but disabled for empty and whitespace-only input', async () => {
    expect(submitButton().disabled).toBe(true);
    await type(' \n ');
    expect(submitButton().disabled).toBe(true);
    submitButton().click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the standard small primary up-arrow variant only when opted in', async () => {
    expect(submitButton().classList.contains('small')).toBe(true);
    expect(submitButton().classList.contains('solid')).toBe(true);
    expect(submitButton().classList.contains('primary')).toBe(true);
    expect(submitButton().querySelector('use')?.getAttribute('href')).toBe('#arrow-up');
    widgetFeatures.set({ displaySearchButton: true });
    await tick();
    expect(submitButton().classList.contains('medium')).toBe(true);
    expect(submitButton().classList.contains('basic')).toBe(true);
    expect(submitButton().querySelector('use')?.getAttribute('href')).toBe('#search');
  });

  it('enables for text, submits once, and returns to disabled', async () => {
    const textarea = await type('A question');
    expect(submitButton().disabled).toBe(false);
    submitButton().click();
    await tick();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('A question');
    expect(textarea.value).toBe('');
    expect(submitButton().disabled).toBe(true);
  });

  it('preserves Enter submission and modified Enter for multiline input', async () => {
    const textarea = await type('A question');
    const modified = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: true, cancelable: true });
    textarea.dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', cancelable: true }));
    await tick();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('A question');
    expect(submitButton().disabled).toBe(true);
  });

  it('does not submit whitespace or an in-progress IME composition', async () => {
    const textarea = await type(' ');
    textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
    await type('A question');
    textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', isComposing: true }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables submission while the composer is disabled', async () => {
    await unmount(component);
    component = mount(ChatInput, {
      target: document.body,
      props: { fullscreen: false, disabled: true, onChange },
    });
    chatInput.set('A question');
    await tick();
    expect(submitButton().disabled).toBe(true);
    input().dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('preserves the existing empty-button and whitespace submission behavior without opt-in', async () => {
    widgetFeatures.set({ displaySearchButton: true });
    await tick();
    expect(submitButton().disabled).toBe(false);
    submitButton().click();
    await tick();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
    onChange.mockClear();
    const textarea = await type(' ');
    textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', isComposing: true }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(' ');
  });

  it('preserves empty Enter behavior without opt-in', async () => {
    widgetFeatures.set({ displaySearchButton: true });
    await tick();
    const event = new KeyboardEvent('keypress', { key: 'Enter', cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});
