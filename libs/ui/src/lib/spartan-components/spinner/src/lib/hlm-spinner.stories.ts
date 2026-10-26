import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSpinnerImports } from '../index';
import { HlmSpinner } from './hlm-spinner';

const meta: Meta = {
  title: 'Spartan/Spinner',
  component: HlmSpinner,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSpinnerImports] })],
  parameters: {
    docs: {
      description: {
        component: `An animated indicator that shows a task is in progress without specifying how much is complete. Use it for loading or processing states when a measurable progress value is not available.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `<hlm-spinner aria-label="Loading report" />`,
  }),
};

export const WithStatusText: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2" role="status">
        <hlm-spinner aria-hidden="true" aria-label="Saving changes" />
        <span>Saving your changes…</span>
      </div>
    `,
  }),
};
