import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDialogImports } from '../index';
import { HlmDialog } from './hlm-dialog';

const meta: Meta = {
  title: 'Spartan/Dialog',
  component: HlmDialog,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmDialogImports] })],
  parameters: {
    docs: {
      description: {
        component: `Opens a focused task or piece of information in a modal window above the page. Use it for short forms, editing details, or interactions that users can complete without leaving their current context.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-dialog>
        <button type="button" hlmBtn hlmDialogTrigger>Edit profile</button>
        <hlm-dialog-content *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>Edit profile</h2>
            <p hlmDialogDescription>Update the name shown to your workspace team.</p>
          </div>
          <label class="grid gap-2 text-sm">
            Display name
            <input class="rounded-md border px-3 py-2" value="Jordan Lee" />
          </label>
          <div hlmDialogFooter>
            <button type="button" hlmBtn hlmDialogClose>Save changes</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    `,
  }),
};

export const WithoutBuiltInCloseButton: Story = {
  render: () => ({
    template: `
      <hlm-dialog>
        <button type="button" hlmBtn hlmDialogTrigger>View keyboard shortcuts</button>
        <hlm-dialog-content [showCloseButton]="false" *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>Keyboard shortcuts</h2>
            <p hlmDialogDescription>Use these shortcuts to move around the workspace.</p>
          </div>
          <p class="text-sm">Press <kbd>⌘ K</kbd> to search and <kbd>⌘ /</kbd> to open help.</p>
          <div hlmDialogFooter>
            <button type="button" hlmBtn hlmDialogClose>Done</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    `,
  }),
};
