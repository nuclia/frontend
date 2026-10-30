import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCheckboxImports } from '../index';
import { HlmCheckbox } from './hlm-checkbox';

interface CheckboxStoryArgs {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
  forceInvalid: boolean;
}

const meta: Meta<CheckboxStoryArgs> = {
  title: 'Spartan/Checkbox',
  component: HlmCheckbox,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmCheckboxImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Let users toggle an option on or off, with support for an indeterminate state.
Import <code>HlmCheckboxImports</code> from <code>@nuclia/ui-spartan/checkbox</code> and use <code>hlm-checkbox</code>.

Listen to <code>checkedChange</code> for the new value, or bind it to a form control with <code>ngModel</code> / reactive forms.
Always provide a visible label (wrap the checkbox in a <code>&lt;label&gt;</code>) or an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    forceInvalid: false,
  },
  argTypes: {
    checked: {
      description: 'Checked state of the checkbox.',
      control: 'boolean',
    },
    indeterminate: {
      description: 'Shows the indeterminate state, e.g. for a "select all" checkbox when only some items are selected.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the checkbox.',
      control: 'boolean',
    },
    required: {
      description: 'Marks the checkbox as required.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <hlm-checkbox
                aria-label="Checkbox"
                [checked]="checked"
                [indeterminate]="indeterminate"
                [disabled]="disabled"
                [required]="required"
                [forceInvalid]="forceInvalid"
            />
        `,
  }),
};

export default meta;

type Story = StoryObj<CheckboxStoryArgs>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const Invalid: Story = {
  args: {
    forceInvalid: true,
  },
};

export const WithLabel: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <label class="flex items-center gap-2 text-sm">
                <hlm-checkbox />
                Accept terms and conditions
            </label>
        `,
  }),
};
