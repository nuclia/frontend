import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmProgressImports } from '../index';
import { HlmProgress } from './hlm-progress';

interface ProgressStoryArgs {
  value: number | null;
  max: number;
}

const meta: Meta<ProgressStoryArgs> = {
  title: 'Spartan/Progress',
  component: HlmProgress,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmProgressImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmProgressImports</code> or the individual components from <code>@nuclia/ui-spartan/progress</code>. Place <code>hlm-progress-indicator</code> inside <code>hlm-progress</code>; set the progress value and maximum on the root.
The primitive exposes progress semantics to assistive technology. Provide an accessible label describing what is progressing, and use a null value for indeterminate progress.`,
      },
    },
  },
  args: { value: 64, max: 100 },
  argTypes: {
    value: { control: 'number', min: 0, max: 100 },
    max: { control: 'number', min: 1 },
  },
  render: ({ value, max }) => ({
    props: { value, max },
    template: `
      <div class="grid w-80 gap-2">
        <div class="flex justify-between text-sm"><span>File upload</span><span>{{ value ?? 'In progress' }}{{ value === null ? '' : '%' }}</span></div>
        <hlm-progress aria-label="File upload progress" [value]="value" [max]="max">
          <hlm-progress-indicator />
        </hlm-progress>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<ProgressStoryArgs>;

export const Default: Story = {};

export const Indeterminate: Story = { args: { value: null } };

export const Complete: Story = { args: { value: 100 } };
