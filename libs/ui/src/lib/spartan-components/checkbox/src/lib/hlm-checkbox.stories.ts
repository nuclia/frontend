import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCheckboxImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmCheckbox } from './hlm-checkbox';

interface CheckboxStoryArgs {
  checked: boolean;
  disabled: boolean;
}

const meta: Meta<CheckboxStoryArgs> = {
  title: 'Spartan/Checkbox',
  component: HlmCheckbox,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmCheckboxImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmCheckbox</code> or <code>HlmCheckboxImports</code> from <code>@nuclia/ui-spartan/checkbox</code>. Add <code>HlmLabel</code> from <code>@nuclia/ui-spartan/label</code> for a visible label.
Use <code>checked</code>, <code>disabled</code>, <code>required</code>, and <code>indeterminate</code> to describe the control state. Associate the label with <code>inputId</code> and use a field description when additional context is needed; the checkbox supports keyboard interaction and announces its checked state.`,
      },
    },
  },
  args: { checked: false, disabled: false },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: ({ checked, disabled }) => ({
    props: { checked, disabled },
    template: `
      <div class="flex items-center gap-2">
        <hlm-checkbox inputId="email-updates" [checked]="checked" [disabled]="disabled" />
        <label hlmLabel for="email-updates">Email me product updates</label>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<CheckboxStoryArgs>;

export const Default: Story = {};

export const Checked: Story = { args: { checked: true } };

export const Disabled: Story = { args: { disabled: true } };
