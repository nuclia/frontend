import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmInput } from '../../../input/src/index';
import { HlmLabel } from '../../../label/src/index';
import { HlmDialogImports } from '../index';
import { HlmDialog } from './hlm-dialog';

interface DialogStoryArgs {
  title: string;
  description: string;
  showCloseButton: boolean;
  closeLabel: string;
  disableClose: boolean;
  closeOnOutsidePointerEvents: boolean;
}

const meta: Meta<DialogStoryArgs> = {
  title: 'Spartan/Dialog',
  component: HlmDialog,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, HlmInput, HlmLabel, ...HlmDialogImports] })],
  parameters: {
    docs: {
      description: {
        component: `Open a focused task or piece of information in a modal window above the page. Use it for short forms, editing details or interactions that users can complete without leaving their current context.
Import <code>HlmDialogImports</code> from <code>@nuclia/ui-spartan/dialog</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for the buttons).

Compose <code>hlm-dialog</code> with a <code>button[hlmDialogTrigger]</code> and an <code>hlm-dialog-content</code> rendered through <code>*hlmDialogPortal</code>.
Inside, use <code>hlmDialogHeader</code> (with <code>hlmDialogTitle</code> and <code>hlmDialogDescription</code>) and <code>hlmDialogFooter</code>; add <code>hlmDialogClose</code> to any button that should close the dialog.
Inputs on <code>hlm-dialog</code>: <code>disableClose</code>, <code>closeOnOutsidePointerEvents</code>, <code>hasBackdrop</code>, <code>state</code> (to control it programmatically); output: <code>closed</code>.
Inputs on <code>hlm-dialog-content</code>: <code>showCloseButton</code> and <code>closeLabel</code> (the screen reader text of the close button).
Always include a title so the dialog has an accessible name. For destructive confirmations that require an explicit answer, use the alert dialog instead.`,
      },
    },
  },
  args: {
    title: 'Edit profile',
    description: 'Update the name shown to your workspace team.',
    showCloseButton: true,
    closeLabel: 'Close',
    disableClose: false,
    closeOnOutsidePointerEvents: true,
  },
  argTypes: {
    title: {
      description: 'Dialog title (story-only argument).',
      control: 'text',
    },
    description: {
      description: 'Dialog description (story-only argument).',
      control: 'text',
    },
    showCloseButton: {
      description: 'Shows the "X" close button in the top-right corner (<code>hlm-dialog-content</code> input).',
      control: 'boolean',
    },
    closeLabel: {
      description: 'Accessible label of the close button (<code>hlm-dialog-content</code> input).',
      control: 'text',
    },
    disableClose: {
      description: 'Prevents closing the dialog with Escape or by clicking outside (<code>hlm-dialog</code> input).',
      control: 'boolean',
    },
    closeOnOutsidePointerEvents: {
      description: 'Closes the dialog when the backdrop is clicked (<code>hlm-dialog</code> input).',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-dialog [disableClose]="disableClose" [closeOnOutsidePointerEvents]="closeOnOutsidePointerEvents">
        <button type="button" hlmBtn variant="outline" hlmDialogTrigger>Edit profile</button>
        <hlm-dialog-content [showCloseButton]="showCloseButton" [closeLabel]="closeLabel" *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>{{ title }}</h2>
            <p hlmDialogDescription>{{ description }}</p>
          </div>
          <div class="grid gap-2">
            <label hlmLabel for="dialog-display-name">Display name</label>
            <input hlmInput id="dialog-display-name" value="Jordan Lee" />
          </div>
          <div hlmDialogFooter>
            <button type="button" hlmBtn variant="outline" hlmDialogClose>Cancel</button>
            <button type="button" hlmBtn hlmDialogClose>Save changes</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    `,
  }),
};

export default meta;
type Story = StoryObj<DialogStoryArgs>;

export const Default: Story = {};

export const WithoutBuiltInCloseButton: Story = {
  args: {
    title: 'Keyboard shortcuts',
    description: 'Use these shortcuts to move around the workspace.',
    showCloseButton: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-dialog [disableClose]="disableClose" [closeOnOutsidePointerEvents]="closeOnOutsidePointerEvents">
        <button type="button" hlmBtn variant="outline" hlmDialogTrigger>View keyboard shortcuts</button>
        <hlm-dialog-content [showCloseButton]="showCloseButton" [closeLabel]="closeLabel" *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>{{ title }}</h2>
            <p hlmDialogDescription>{{ description }}</p>
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

export const NotDismissible: Story = {
  args: {
    title: 'Accept the updated terms',
    description: 'You must accept the new terms of service to continue using the workspace.',
    showCloseButton: false,
    disableClose: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-dialog [disableClose]="disableClose" [closeOnOutsidePointerEvents]="closeOnOutsidePointerEvents">
        <button type="button" hlmBtn variant="outline" hlmDialogTrigger>Review terms</button>
        <hlm-dialog-content [showCloseButton]="showCloseButton" [closeLabel]="closeLabel" *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>{{ title }}</h2>
            <p hlmDialogDescription>{{ description }}</p>
          </div>
          <div hlmDialogFooter>
            <button type="button" hlmBtn hlmDialogClose>Accept and continue</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    `,
  }),
};

export const ScrollableContent: Story = {
  args: {
    title: 'Terms of service',
    description: 'Scroll to read the full document.',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-dialog [disableClose]="disableClose" [closeOnOutsidePointerEvents]="closeOnOutsidePointerEvents">
        <button type="button" hlmBtn variant="outline" hlmDialogTrigger>Read terms</button>
        <hlm-dialog-content [showCloseButton]="showCloseButton" [closeLabel]="closeLabel" *hlmDialogPortal="let context">
          <div hlmDialogHeader>
            <h2 hlmDialogTitle>{{ title }}</h2>
            <p hlmDialogDescription>{{ description }}</p>
          </div>
          <div class="-mx-4 max-h-48 space-y-3 overflow-y-auto px-4 text-sm">
            <p>1. Your data stays in the region you selected when creating the knowledge box.</p>
            <p>2. Uploaded resources are processed to extract text, entities and embeddings for search.</p>
            <p>3. You can delete a resource at any time; its indexed data is removed within a few minutes.</p>
            <p>4. API keys grant access to everything in the knowledge box. Keep them private and rotate them regularly.</p>
            <p>5. Usage above your plan limits may be throttled until the next billing period.</p>
            <p>6. We notify account owners before any change to these terms takes effect.</p>
          </div>
          <div hlmDialogFooter>
            <button type="button" hlmBtn hlmDialogClose>I understand</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    `,
  }),
};
