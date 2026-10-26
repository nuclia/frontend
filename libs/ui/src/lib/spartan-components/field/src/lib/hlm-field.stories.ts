import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmFieldImports } from '../index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmField } from './hlm-field';

const meta: Meta = {
  title: 'Spartan/Field',
  component: HlmField,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmFieldImports, ...HlmInputImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Organizes a form control with its label, help text, and validation feedback. Use fields and field groups to give forms a consistent structure and make requirements and errors easy to understand.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="display-name">Display name</label>
        <input hlmInput id="display-name" placeholder="e.g. Alex Morgan" />
        <hlm-field-description>This name is visible to your teammates.</hlm-field-description>
      </div>
    `,
  }),
};

export const Horizontal: Story = {
  render: () => ({
    template: `
      <div hlmField orientation="horizontal" class="w-96">
        <label hlmFieldLabel for="weekly-summary">Weekly summary</label>
        <input hlmInput id="weekly-summary" type="email" placeholder="name@example.com" />
      </div>
    `,
  }),
};

export const FieldSet: Story = {
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
