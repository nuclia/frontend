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
        component: `Shows how far a task has advanced toward completion. Use it for uploads, processing, or multi-step flows when users benefit from seeing progress rather than only a loading indicator.
Import <code>HlmProgressImports</code> from <code>@nuclia/ui-spartan/progress</code> and place an <code>hlm-progress-indicator</code> inside <code>hlm-progress</code>; the indicator fills the track according to the parent.

Set <code>value</code> between 0 and <code>max</code> (100 by default). A <code>null</code> value renders the indeterminate animation for tasks of unknown length. Use <code>getValueLabel</code> to customise the text announced to screen readers.
The host has the <code>progressbar</code> role, so always provide an <code>aria-label</code> (or <code>aria-labelledby</code>) describing what is progressing.`,
      },
    },
  },
  args: { value: 64, max: 100 },
  argTypes: {
    value: {
      description: 'Current progress, from 0 to <code>max</code>. Use <code>null</code> for an indeterminate state.',
      control: { type: 'number', min: 0, max: 100 },
    },
    max: {
      description: 'Value at which the task is complete.',
      control: { type: 'number', min: 1 },
    },
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

export const Empty: Story = { args: { value: 0 } };

export const Indeterminate: Story = { args: { value: null } };

export const Complete: Story = { args: { value: 100 } };

export const CustomMaximum: Story = {
  args: { value: 3, max: 5 },
  render: ({ value, max }) => ({
    props: {
      value,
      max,
      stepLabel: (current: number, total: number) => `Step ${current} of ${total}`,
    },
    template: `
      <div class="grid w-80 gap-2">
        <div class="flex justify-between text-sm"><span>Onboarding</span><span>Step {{ value }} of {{ max }}</span></div>
        <hlm-progress aria-label="Onboarding progress" [value]="value" [max]="max" [getValueLabel]="stepLabel">
          <hlm-progress-indicator />
        </hlm-progress>
      </div>
    `,
  }),
};
