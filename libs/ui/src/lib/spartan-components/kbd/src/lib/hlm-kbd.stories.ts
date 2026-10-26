import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmKbdImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Kbd',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmKbdImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmKbdImports</code> from <code>@nuclia/ui-spartan/kbd</code>. Apply <code>hlmKbd</code> to a key label and group simultaneous keys with <code>hlmKbdGroup</code>. These are visual hints only: ensure the described shortcut is also available through accessible instructions and works with the user's keyboard layout.`,
      },
    },
  },
  render: () => ({
    template: `<p class="flex items-center gap-3">Search resources
      <kbd hlmKbdGroup aria-label="Press Command and K">
        <kbd hlmKbd aria-hidden="true">⌘</kbd><kbd hlmKbd aria-hidden="true">K</kbd>
      </kbd>
    </p>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
export const SingleKey: Story = {
  render: () => ({
    template: `<p class="flex items-center gap-3">Open help <kbd hlmKbd>?</kbd></p>`,
  }),
};
