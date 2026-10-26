import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmToggleImports } from '../index';
import { HlmToggle } from './hlm-toggle';

interface ToggleStoryArgs {
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  state: 'on' | 'off';
  disabled: boolean;
}

const meta: Meta<ToggleStoryArgs> = {
  title: 'Spartan/Toggle',
  component: HlmToggle,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmToggleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmToggle</code> or <code>HlmToggleImports</code> from <code>@nuclia/ui-spartan/toggle</code> and apply <code>hlmToggle</code> to a native button.
Use the <code>variant</code>, <code>size</code>, <code>state</code>, and <code>disabled</code> inputs to configure the toggle. Provide a visible text label or an accessible name for icon-only buttons; pressed state is exposed to assistive technology.`,
      },
    },
  },
  args: { variant: 'default', size: 'default', state: 'off', disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline'] },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
    state: { control: 'select', options: ['on', 'off'] },
    disabled: { control: 'boolean' },
  },
  render: ({ variant, size, state, disabled }) => ({
    props: { variant, size, state, disabled },
    template: `
      <button hlmToggle type="button" aria-label="Pin resource" [variant]="variant" [size]="size" [state]="state" [disabled]="disabled">
        Pin resource
      </button>
    `,
  }),
};

export default meta;

type Story = StoryObj<ToggleStoryArgs>;

export const Default: Story = {};

export const Pressed: Story = { args: { state: 'on' } };

export const Outline: Story = { args: { variant: 'outline' } };

export const Disabled: Story = { args: { disabled: true } };
