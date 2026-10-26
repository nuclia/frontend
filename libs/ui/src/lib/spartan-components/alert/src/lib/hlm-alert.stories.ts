import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAlertImports } from '../index';

interface AlertStoryArgs {
  variant: 'default' | 'destructive';
}

const meta: Meta<AlertStoryArgs> = {
  title: 'Spartan/Alert',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAlertImports] })],
  parameters: {
    docs: {
      description: {
        component: `Highlights important information within the page, such as a warning, an error, or a status update. Unlike a dialog, an alert keeps the message in context without interrupting the user's task.`,
      },
    },
  },
  args: { variant: 'default' },
  argTypes: { variant: { control: 'select', options: ['default', 'destructive'] } },
  render: ({ variant }) => ({
    props: { variant },
    template: `<div hlm-alert [variant]="variant" class="max-w-lg">
      <button hlmAlertAction type="button" aria-label="Dismiss resource status">×</button>
      <h2 hlmAlertTitle>Resource is ready</h2>
      <div hlmAlertDescription>Your report has finished processing and is available to review.</div>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<AlertStoryArgs>;
export const Default: Story = {};
export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: () => ({
    template: `<div hlm-alert variant="destructive" class="max-w-lg">
      <h2 hlmAlertTitle>Upload could not be completed</h2>
      <div hlmAlertDescription>Check the file format and try again.</div>
    </div>`,
  }),
};
