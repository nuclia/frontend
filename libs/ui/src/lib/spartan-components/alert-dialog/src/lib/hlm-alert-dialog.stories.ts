import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmAlertDialogImports } from '../index';
import { HlmAlertDialog } from './hlm-alert-dialog';

interface AlertDialogStoryArgs {
  size: 'default' | 'sm';
  title: string;
  description: string;
}

const meta: Meta<AlertDialogStoryArgs> = {
  title: 'Spartan/Alert Dialog',
  component: HlmAlertDialog,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmAlertDialogImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideTrash2 })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `A modal dialog that interrupts the user with important content and expects a response.
Import <code>HlmAlertDialogImports</code> from <code>@nuclia/ui-spartan/alert-dialog</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for the trigger).

Compose <code>hlm-alert-dialog</code> with a <code>hlmAlertDialogTrigger</code> button and an <code>hlm-alert-dialog-content</code> rendered through <code>*hlmAlertDialogPortal</code>.
Inside, use <code>hlm-alert-dialog-header</code> (<code>hlmAlertDialogTitle</code>, <code>hlmAlertDialogDescription</code>) and <code>hlm-alert-dialog-footer</code> (<code>hlmAlertDialogCancel</code>, <code>hlmAlertDialogAction</code>).
Use <code>#dialog="hlmAlertDialog"</code> and <code>dialog.close()</code> to close the dialog from an action. Set <code>size</code> on the content to <code>sm</code> for a compact layout.`,
      },
    },
  },
  args: {
    size: 'default',
    title: 'Are you absolutely sure?',
    description: 'This action cannot be undone. This will permanently delete your account and remove your data.',
  },
  argTypes: {
    size: {
      description: 'Size of the dialog content.',
      control: 'select',
      options: ['default', 'sm'],
    },
    title: {
      description: 'Dialog title.',
      control: 'text',
    },
    description: {
      description: 'Dialog description.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <hlm-alert-dialog #dialog="hlmAlertDialog">
                <button hlmAlertDialogTrigger hlmBtn variant="outline" type="button">Open dialog</button>
                <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" [size]="size">
                    <hlm-alert-dialog-header>
                        <h2 hlmAlertDialogTitle>{{ title }}</h2>
                        <p hlmAlertDialogDescription>{{ description }}</p>
                    </hlm-alert-dialog-header>
                    <hlm-alert-dialog-footer>
                        <button hlmAlertDialogCancel type="button">Cancel</button>
                        <button hlmAlertDialogAction type="button" (click)="dialog.close()">Continue</button>
                    </hlm-alert-dialog-footer>
                </hlm-alert-dialog-content>
            </hlm-alert-dialog>
        `,
  }),
};

export default meta;

type Story = StoryObj<AlertDialogStoryArgs>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
    title: 'Discard changes?',
    description: 'Your unsaved changes will be lost.',
  },
};

export const WithMedia: Story = {
  args: {
    size: 'default',
    title: 'Delete this item?',
    description: 'This will permanently delete the item and cannot be undone.',
  },
  render: (args) => ({
    props: args,
    template: `
            <hlm-alert-dialog #dialog="hlmAlertDialog">
                <button hlmAlertDialogTrigger hlmBtn variant="destructive" type="button">Delete</button>
                <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" [size]="size">
                    <hlm-alert-dialog-header>
                        <hlm-alert-dialog-media>
                            <ng-icon name="lucideTrash2" />
                        </hlm-alert-dialog-media>
                        <h2 hlmAlertDialogTitle>{{ title }}</h2>
                        <p hlmAlertDialogDescription>{{ description }}</p>
                    </hlm-alert-dialog-header>
                    <hlm-alert-dialog-footer>
                        <button hlmAlertDialogCancel type="button">Cancel</button>
                        <button hlmAlertDialogAction type="button" (click)="dialog.close()">Delete</button>
                    </hlm-alert-dialog-footer>
                </hlm-alert-dialog-content>
            </hlm-alert-dialog>
        `,
  }),
};
