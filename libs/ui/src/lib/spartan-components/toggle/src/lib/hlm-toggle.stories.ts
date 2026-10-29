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
        component: `A button with a persistent pressed or unpressed state. Use it to activate a mode or formatting option, such as bold text, rather than perform a one-off action.`,
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
