import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmKbdImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Kbd',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmKbdImports] })],
  parameters: {
    docs: {
      description: {
        component: `Displays a keyboard key or key combination as a visual hint. Use it in menus, tooltips, and instructions to help users discover available keyboard shortcuts.`,
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
