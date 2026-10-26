import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAlertDialogImports } from '../index';
import { HlmButton } from '../../../button/src/index';
import { HlmAlertDialog } from './hlm-alert-dialog';

const meta: Meta = {
  title: 'Spartan/Alert Dialog',
  component: HlmAlertDialog,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmAlertDialogImports] })],
  parameters: {
    docs: {
      description: {
        component: `Use a modal alert dialog for an important decision that needs confirmation. Import <code>HlmAlertDialogImports</code>, or the individual <code>HlmAlertDialog</code>, <code>HlmAlertDialogTrigger</code>, <code>HlmAlertDialogPortal</code>, content, header, title, description, footer, cancel, and action primitives from <code>@nuclia/ui-spartan/alert-dialog</code>. Compose the trigger with a portal template containing labelled content and clearly named actions. The alert-dialog primitive supplies modal alert-dialog semantics and keyboard focus management; always provide a title and a concise description.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-alert-dialog>
        <button type="button" hlmBtn hlmAlertDialogTrigger>Remove team member</button>
        <hlm-alert-dialog-content *hlmAlertDialogPortal="let context">
          <div hlmAlertDialogHeader>
            <h2 hlmAlertDialogTitle>Remove this team member?</h2>
            <p hlmAlertDialogDescription>
              Alex will lose access to the Acme workspace. This action cannot be undone.
            </p>
          </div>
          <div hlmAlertDialogFooter>
            <button type="button" hlmAlertDialogCancel>Keep member</button>
            <button type="button" hlmAlertDialogAction>Remove member</button>
          </div>
        </hlm-alert-dialog-content>
      </hlm-alert-dialog>
    `,
  }),
};

export const Compact: Story = {
  render: () => ({
    template: `
      <hlm-alert-dialog>
        <button type="button" hlmBtn hlmAlertDialogTrigger>Discard draft</button>
        <hlm-alert-dialog-content size="sm" *hlmAlertDialogPortal="let context">
          <div hlmAlertDialogHeader>
            <h2 hlmAlertDialogTitle>Discard this draft?</h2>
            <p hlmAlertDialogDescription>Your unsaved changes will be permanently removed.</p>
          </div>
          <div hlmAlertDialogFooter>
            <button type="button" hlmAlertDialogCancel>Continue editing</button>
            <button type="button" hlmAlertDialogAction>Discard draft</button>
          </div>
        </hlm-alert-dialog-content>
      </hlm-alert-dialog>
    `,
  }),
};
