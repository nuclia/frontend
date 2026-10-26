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
        component: `Import <code>HlmSpinner</code> or <code>HlmSpinnerImports</code> from <code>@nuclia/ui-spartan/spinner</code>. The spinner uses a registered icon name and accepts an <code>aria-label</code>.
Use a concise status label such as “Loading report”; pair it with visible status text when the loading state is important to the task.`,
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
