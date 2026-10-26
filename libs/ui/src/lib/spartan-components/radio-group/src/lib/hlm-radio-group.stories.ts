import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmRadioGroupImports } from '../index';
import { HlmRadioGroup } from './hlm-radio-group';

interface RadioGroupStoryArgs {
  value: string;
  disabled: boolean;
}

const meta: Meta<RadioGroupStoryArgs> = {
  title: 'Spartan/Radio Group',
  component: HlmRadioGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmRadioGroupImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmRadioGroupImports</code> or its components from <code>@nuclia/ui-spartan/radio-group</code>, and <code>HlmLabel</code> from <code>@nuclia/ui-spartan/label</code> for visible option labels.
Compose <code>hlm-radio-group</code> with <code>hlm-radio</code> and <code>hlm-radio-indicator</code>. Give the group an accessible label and each radio a value and associated visible label. The group supports standard arrow-key navigation.`,
      },
    },
  },
  args: { value: 'monthly', disabled: false },
  argTypes: {
    value: { control: 'select', options: ['monthly', 'annual'] },
    disabled: { control: 'boolean' },
  },
  render: ({ value, disabled }) => ({
    props: { value, disabled },
    template: `
      <fieldset class="grid gap-3">
        <legend class="text-sm font-medium">Billing cycle</legend>
        <div hlmRadioGroup aria-label="Billing cycle" [value]="value" [disabled]="disabled">
          <div class="flex items-center gap-2">
            <hlm-radio inputId="billing-monthly" value="monthly"><hlm-radio-indicator /></hlm-radio>
            <label hlmLabel for="billing-monthly">Monthly</label>
          </div>
          <div class="flex items-center gap-2">
            <hlm-radio inputId="billing-annual" value="annual"><hlm-radio-indicator /></hlm-radio>
            <label hlmLabel for="billing-annual">Annual (save 10%)</label>
          </div>
        </div>
      </fieldset>
    `,
  }),
};

export default meta;

type Story = StoryObj<RadioGroupStoryArgs>;

export const Default: Story = {};

export const AnnualSelected: Story = { args: { value: 'annual' } };

export const Disabled: Story = { args: { disabled: true } };
