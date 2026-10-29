import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCheckboxImports } from '../../../checkbox/src/index';
import { HlmFieldImports } from '../index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmField } from './hlm-field';

type FieldOrientation = 'vertical' | 'horizontal' | 'responsive';

interface FieldStoryArgs {
  label: string;
  description: string;
  errorMessage: string;
  orientation: FieldOrientation;
  invalid: boolean;
  disabled: boolean;
}

const meta: Meta<FieldStoryArgs> = {
  title: 'Spartan/Field',
  component: HlmField,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmFieldImports, ...HlmInputImports, ...HlmLabelImports, ...HlmCheckboxImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Organizes a form control with its label, help text, and validation feedback. Use fields and field groups to give forms a consistent structure and make requirements and errors easy to understand.
Import <code>HlmFieldImports</code> from <code>@nuclia/ui-spartan/field</code>.

Wrap a control in <code>hlmField</code> and add <code>hlmFieldLabel</code> (linked to the control with <code>for</code>/<code>id</code>), <code>hlm-field-description</code> and <code>hlm-field-error</code>.
The <code>orientation</code> input of <code>hlmField</code> is <code>vertical</code> (default), <code>horizontal</code> or <code>responsive</code> (switches to a row inside a <code>hlmFieldGroup</code> container that is wide enough).
<code>hlm-field-error</code> only appears when the bound form control is invalid (optionally for a given <code>validator</code>); use <code>forceShow</code> to display it unconditionally, and <code>forceInvalid</code> on the field and on the control to force the invalid style.
Use <code>fieldset[hlmFieldSet]</code> with <code>legend[hlmFieldLegend]</code> to group related fields, <code>hlmFieldGroup</code> to stack fields, <code>hlm-field-separator</code> to divide them, and <code>hlmFieldContent</code> / <code>hlmFieldTitle</code> for a label with description next to a control.
Description and error ids are linked to the control through <code>aria-describedby</code> automatically.`,
      },
    },
  },
  args: {
    label: 'Email address',
    description: 'We only use it to send billing receipts.',
    errorMessage: 'Enter a valid email address.',
    orientation: 'vertical',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    label: {
      description: 'Text of the field label.',
      control: 'text',
    },
    description: {
      description: 'Help text shown below the control (<code>hlm-field-description</code>).',
      control: 'text',
    },
    errorMessage: {
      description: 'Validation message (<code>hlm-field-error</code>), displayed when the field is invalid.',
      control: 'text',
    },
    orientation: {
      description: 'Layout of the field children: stacked, in a row, or responsive to the field group width.',
      control: 'inline-radio',
      options: ['vertical', 'horizontal', 'responsive'],
    },
    invalid: {
      description: 'Forces the invalid style on the field and the input, and shows the error message.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the input.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmField [orientation]="orientation" [forceInvalid]="invalid" class="w-96">
        <label hlmFieldLabel for="field-email">{{ label }}</label>
        <input
          hlmInput
          id="field-email"
          type="email"
          placeholder="name@example.com"
          [disabled]="disabled"
          [forceInvalid]="invalid" />
        <hlm-field-description>{{ description }}</hlm-field-description>
        <hlm-field-error [forceShow]="invalid">{{ errorMessage }}</hlm-field-error>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<FieldStoryArgs>;

export const Default: Story = {};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Horizontal: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmField orientation="horizontal" class="w-96">
        <hlm-checkbox inputId="marketing-emails" />
        <div hlmFieldContent>
          <label hlmFieldLabel for="marketing-emails">Product updates</label>
          <hlm-field-description>Receive an email when we release new features.</hlm-field-description>
        </div>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmFieldGroup class="w-96">
        <div hlmField>
          <label hlmFieldLabel for="login-email">Email address</label>
          <input hlmInput id="login-email" type="email" placeholder="name@example.com" />
        </div>
        <hlm-field-separator>or continue with</hlm-field-separator>
        <div hlmField>
          <label hlmFieldLabel for="login-token">Access token</label>
          <input hlmInput id="login-token" type="password" placeholder="Paste your token" />
        </div>
      </div>
    `,
  }),
};

export const FieldSet: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <fieldset hlmFieldSet class="w-96">
        <legend hlmFieldLegend>Contact preferences</legend>
        <p hlmFieldDescription>Choose how we can reach you about account activity.</p>
        <div hlmFieldGroup>
          <div hlmField>
            <label hlmFieldLabel for="contact-email">Email address</label>
            <input hlmInput id="contact-email" type="email" placeholder="name@example.com" />
          </div>
          <hlm-field-separator>or</hlm-field-separator>
          <div hlmField>
            <label hlmFieldLabel for="contact-phone">Phone number</label>
            <input hlmInput id="contact-phone" type="tel" placeholder="+1 555 0100" />
          </div>
        </div>
      </fieldset>
    `,
  }),
};
