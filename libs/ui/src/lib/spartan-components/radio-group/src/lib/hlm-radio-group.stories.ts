import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmRadioGroupImports } from '../index';
import { HlmRadioGroup } from './hlm-radio-group';

interface RadioGroupStoryArgs {
  value: string;
  disabled: boolean;
  required: boolean;
}

const meta: Meta<RadioGroupStoryArgs> = {
  title: 'Spartan/Radio Group',
  component: HlmRadioGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmRadioGroupImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Lets users choose one option from a set of mutually exclusive choices. Use it when the available options should remain visible for comparison, such as selecting a plan or delivery method.
Import <code>HlmRadioGroupImports</code> from <code>@nuclia/ui-spartan/radio-group</code>. Put an <code>hlmRadioGroup</code> container around several <code>hlm-radio</code> items, each with a unique <code>value</code> and an <code>hlm-radio-indicator</code> child.

The group exposes <code>name</code>, <code>value</code>, <code>disabled</code> and <code>required</code>, and emits <code>valueChange</code>; it works with Angular forms. <code>hlm-radio</code> accepts <code>inputId</code>, <code>disabled</code> and emits <code>change</code>.
Link each radio to an <code>hlmLabel</code> through <code>inputId</code> and <code>for</code>, and give the group an <code>aria-label</code> or wrap it in a <code>fieldset</code> with a <code>legend</code>.`,
      },
    },
  },
  args: { value: 'monthly', disabled: false, required: false },
  argTypes: {
    value: {
      description: 'Value of the selected radio.',
      control: 'inline-radio',
      options: ['monthly', 'annual'],
    },
    disabled: {
      description: 'Disables every radio in the group.',
      control: 'boolean',
    },
    required: {
      description: 'Marks the group as requiring a selection.',
      control: 'boolean',
    },
  },
  render: ({ value, disabled, required }) => ({
    props: { value, disabled, required },
    template: `
      <fieldset class="grid gap-3">
        <legend class="text-sm font-medium">Billing cycle</legend>
        <div hlmRadioGroup aria-label="Billing cycle" [value]="value" [disabled]="disabled" [required]="required">
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

export const Required: Story = { args: { required: true } };

export const DisabledOption: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <fieldset class="grid gap-3">
        <legend class="text-sm font-medium">Delivery method</legend>
        <div hlmRadioGroup aria-label="Delivery method" value="standard">
          <div class="flex items-center gap-2">
            <hlm-radio inputId="delivery-standard" value="standard"><hlm-radio-indicator /></hlm-radio>
            <label hlmLabel for="delivery-standard">Standard (3-5 days)</label>
          </div>
          <div class="flex items-center gap-2">
            <hlm-radio inputId="delivery-express" value="express"><hlm-radio-indicator /></hlm-radio>
            <label hlmLabel for="delivery-express">Express (1-2 days)</label>
          </div>
          <div class="flex items-center gap-2">
            <hlm-radio inputId="delivery-pickup" value="pickup" disabled><hlm-radio-indicator /></hlm-radio>
            <label hlmLabel for="delivery-pickup">Store pickup (unavailable)</label>
          </div>
        </div>
      </fieldset>
    `,
  }),
};

export const WithDescriptions: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <fieldset class="grid gap-3">
        <legend class="text-sm font-medium">Notification frequency</legend>
        <div hlmRadioGroup aria-label="Notification frequency" value="digest">
          <div class="flex items-start gap-2">
            <hlm-radio inputId="notify-instant" value="instant" aria-describedby="notify-instant-hint">
              <hlm-radio-indicator />
            </hlm-radio>
            <div class="grid gap-1">
              <label hlmLabel for="notify-instant">Instant</label>
              <p id="notify-instant-hint" class="text-muted-foreground text-sm">Get an email for every new comment.</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <hlm-radio inputId="notify-digest" value="digest" aria-describedby="notify-digest-hint">
              <hlm-radio-indicator />
            </hlm-radio>
            <div class="grid gap-1">
              <label hlmLabel for="notify-digest">Daily digest</label>
              <p id="notify-digest-hint" class="text-muted-foreground text-sm">One summary email each morning.</p>
            </div>
          </div>
        </div>
      </fieldset>
    `,
  }),
};
