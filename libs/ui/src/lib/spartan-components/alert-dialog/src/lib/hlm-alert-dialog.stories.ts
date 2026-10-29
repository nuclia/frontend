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
        component: `Interrupts the current task to ask for confirmation of an important action. Use it for decisions with significant consequences, such as deleting data, with clear options to confirm or cancel.`,
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
