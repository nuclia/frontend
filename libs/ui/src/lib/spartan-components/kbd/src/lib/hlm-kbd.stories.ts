import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmKbdImports } from '../index';
import { HlmKbd } from './hlm-kbd';

const meta: Meta = {
  title: 'Spartan/Kbd',
  component: HlmKbd,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmKbdImports] })],
  parameters: {
    // Kbd has no inputs, so there is nothing to tweak in the controls panel.
    controls: { disable: true },
    docs: {
      description: {
        component: `Displays a keyboard key or key combination as a visual hint. Use it in menus, tooltips, and instructions to help users discover available keyboard shortcuts.
Import <code>HlmKbdImports</code> from <code>@nuclia/ui-spartan/kbd</code>.

Put <code>hlmKbd</code> on a native <code>&lt;kbd&gt;</code> element for each key, and wrap several keys in <code>&lt;kbd hlmKbdGroup&gt;</code> to lay out a combination. Neither directive has inputs.
Keys are purely visual (non-interactive). For a combination, give the group an <code>aria-label</code> that spells the shortcut out (for example "Press Command and K") and hide the individual keys with <code>aria-hidden="true"</code> so screen readers do not read the symbols one by one.`,
      },
    },
  },
  render: () => ({
    template: `
      <p class="flex items-center gap-3 text-sm">
        Search resources
        <kbd hlmKbdGroup aria-label="Press Command and K">
          <kbd hlmKbd aria-hidden="true">⌘</kbd>
          <kbd hlmKbd aria-hidden="true">K</kbd>
        </kbd>
      </p>
    `,
  }),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const SingleKey: Story = {
  render: () => ({
    template: `
      <p class="flex items-center gap-3 text-sm">
        Open help
        <kbd hlmKbd aria-label="Press question mark">?</kbd>
      </p>
    `,
  }),
};

export const ThreeKeyCombination: Story = {
  render: () => ({
    template: `
      <p class="flex items-center gap-3 text-sm">
        Open the command palette
        <kbd hlmKbdGroup aria-label="Press Control, Shift and P">
          <kbd hlmKbd aria-hidden="true">Ctrl</kbd>
          <kbd hlmKbd aria-hidden="true">Shift</kbd>
          <kbd hlmKbd aria-hidden="true">P</kbd>
        </kbd>
      </p>
    `,
  }),
};

export const ShortcutList: Story = {
  render: () => ({
    template: `
      <ul class="flex w-72 flex-col gap-2 text-sm">
        <li class="flex items-center justify-between">
          Save changes
          <kbd hlmKbdGroup aria-label="Press Command and S">
            <kbd hlmKbd aria-hidden="true">⌘</kbd>
            <kbd hlmKbd aria-hidden="true">S</kbd>
          </kbd>
        </li>
        <li class="flex items-center justify-between">
          Close the panel
          <kbd hlmKbd aria-label="Press Escape">Esc</kbd>
        </li>
        <li class="flex items-center justify-between">
          Move between results
          <kbd hlmKbdGroup aria-label="Press the up and down arrow keys">
            <kbd hlmKbd aria-hidden="true">↑</kbd>
            <kbd hlmKbd aria-hidden="true">↓</kbd>
          </kbd>
        </li>
      </ul>
    `,
  }),
};
