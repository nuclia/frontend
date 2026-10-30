import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmToggleImports } from '../index';
import { HlmToggle } from './hlm-toggle';

interface ToggleStoryArgs {
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  disabled: boolean;
  state: 'on' | 'off';
  label: string;
}

const meta: Meta<ToggleStoryArgs> = {
  title: 'Spartan/Toggle',
  component: HlmToggle,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmToggleImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `A two-state button that can be either on or off.
Import <code>HlmToggleImports</code> from <code>@nuclia/ui-spartan/toggle</code> and apply <code>hlmToggle</code> to a native <code>&lt;button&gt;</code>.

Use <code>state</code> to set the initial state and listen to <code>stateChange</code> for updates. Icon-only toggles should include an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    state: 'off',
    label: 'Toggle',
  },
  argTypes: {
    variant: {
      description: 'Visual style of the toggle.',
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      description: 'Size of the toggle.',
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    disabled: {
      description: 'Disables the toggle.',
      control: 'boolean',
    },
    state: {
      description: 'Initial pressed state of the toggle.',
      control: 'select',
      options: ['on', 'off'],
    },
    label: {
      description: 'Toggle text.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <button
                hlmToggle
                type="button"
                [variant]="variant"
                [size]="size"
                [disabled]="disabled"
                [state]="state"
            >
                {{ label }}
            </button>
        `,
  }),
};

export default meta;

type Story = StoryObj<ToggleStoryArgs>;

export const Default: Story = {};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const On: Story = {
  args: {
    state: 'on',
  },
};

export const Sizes: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex items-center gap-3">
                <button hlmToggle type="button" variant="outline" size="sm">Small</button>
                <button hlmToggle type="button" variant="outline" size="default">Default</button>
                <button hlmToggle type="button" variant="outline" size="lg">Large</button>
            </div>
        `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
