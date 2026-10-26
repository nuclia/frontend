import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmSwitchImports } from '../index';
import { HlmSwitch } from './hlm-switch';

interface SwitchStoryArgs {
  checked: boolean;
  disabled: boolean;
  size: 'default' | 'sm';
}

const meta: Meta<SwitchStoryArgs> = {
  title: 'Spartan/Switch',
  component: HlmSwitch,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSwitchImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmSwitchImports</code> or the switch components from <code>@nuclia/ui-spartan/switch</code>; use <code>HlmLabel</code> from <code>@nuclia/ui-spartan/label</code> for a visible label.
Set the switch's <code>inputId</code> and associate the label with it. A switch represents an immediate on/off setting, supports keyboard operation, and announces its checked state.`,
      },
    },
  },
  args: { checked: false, disabled: false, size: 'default' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'select', options: ['default', 'sm'] },
  },
  render: ({ checked, disabled, size }) => ({
    props: { checked, disabled, size },
    template: `
      <div class="flex items-center gap-3">
        <hlm-switch inputId="notifications" [checked]="checked" [disabled]="disabled" [size]="size" />
        <label hlmLabel for="notifications">Enable notifications</label>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SwitchStoryArgs>;

export const Default: Story = {};

export const Enabled: Story = { args: { checked: true } };

export const Small: Story = { args: { size: 'sm' } };

export const Disabled: Story = { args: { disabled: true } };
