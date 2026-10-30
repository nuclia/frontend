import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmSpinnerImports } from '../index';
import { HlmSpinner } from './hlm-spinner';

interface SpinnerStoryArgs {
  icon: string;
  ariaLabel: string;
  sizeClass: string;
}

const meta: Meta<SpinnerStoryArgs> = {
  title: 'Spartan/Spinner',
  component: HlmSpinner,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmSpinnerImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideLoaderCircle })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `An animated indicator that shows a task is in progress without specifying how much is complete. Use it for loading or processing states when a measurable progress value is not available.
Import <code>HlmSpinnerImports</code> from <code>@nuclia/ui-spartan/spinner</code> and use <code>&lt;hlm-spinner /&gt;</code>.

The spinner renders an icon (<code>icon</code> input, <code>lucideLoader2</code> by default; register custom icons with <code>provideIcons</code>) and exposes <code>role="status"</code>. Set a meaningful <code>aria-label</code> (default "Loading").
Resize it with a text-size class, e.g. <code>class="text-2xl"</code>. The rotation is disabled for users who prefer reduced motion.`,
      },
    },
  },
  args: {
    icon: 'lucideLoader2',
    ariaLabel: 'Loading report',
    sizeClass: 'text-base',
  },
  argTypes: {
    icon: {
      description: 'Name of the registered icon used as the spinner.',
      control: 'select',
      options: ['lucideLoader2', 'lucideLoaderCircle'],
    },
    ariaLabel: {
      description: 'Accessible label announced for the status role, set through the <code>aria-label</code> attribute.',
      control: 'text',
    },
    sizeClass: {
      description: 'Text size class applied to the host to resize the spinner (not an input).',
      control: 'select',
      options: ['text-base', 'text-2xl', 'text-4xl'],
    },
  },
  render: (args) => ({
    props: args,
    template: `<hlm-spinner [icon]="icon" [aria-label]="ariaLabel" [class]="sizeClass" />`,
  }),
};

export default meta;

type Story = StoryObj<SpinnerStoryArgs>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    sizeClass: 'text-4xl',
  },
};

export const CustomIcon: Story = {
  args: {
    icon: 'lucideLoaderCircle',
  },
};

export const WithStatusText: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div class="flex items-center gap-2 text-sm">
        <hlm-spinner aria-label="Saving changes" />
        <span>Saving your changes…</span>
      </div>
    `,
  }),
};

export const InsideButton: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <button hlmBtn type="button" disabled>
        <hlm-spinner aria-label="Uploading" />
        Uploading file
      </button>
    `,
  }),
};
