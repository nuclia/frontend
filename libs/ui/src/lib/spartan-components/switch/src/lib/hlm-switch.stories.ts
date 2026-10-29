import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmSwitchImports } from '../index';
import { HlmSwitch } from './hlm-switch';

interface SwitchStoryArgs {
  checked: boolean;
  disabled: boolean;
  size: 'default' | 'sm';
  forceInvalid: boolean;
}

const meta: Meta<SwitchStoryArgs> = {
  title: 'Spartan/Switch',
  component: HlmSwitch,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSwitchImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Turns a setting on or off, usually with an immediate effect. Use it for binary preferences such as enabling notifications, rather than selecting items to submit as a group.
Import <code>HlmSwitchImports</code> from <code>@nuclia/ui-spartan/switch</code> and use <code>&lt;hlm-switch /&gt;</code>; the thumb (<code>hlm-switch-thumb</code>) is rendered internally.

Listen to <code>checkedChange</code> for the new value, or bind it with <code>ngModel</code> / reactive forms. Set <code>inputId</code> to link an external <code>&lt;label for&gt;</code>, or pass <code>aria-label</code> / <code>aria-labelledby</code> when there is no visible label.
Use <code>size</code> for the default or compact variant and <code>forceInvalid</code> to display the invalid style.`,
      },
    },
  },
  args: { checked: false, disabled: false, size: 'default', forceInvalid: false },
  argTypes: {
    checked: {
      description: 'Checked (on) state of the switch.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the switch.',
      control: 'boolean',
    },
    size: {
      description: 'Size of the switch.',
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="flex items-center gap-3">
        <hlm-switch
          inputId="notifications"
          [checked]="checked"
          [disabled]="disabled"
          [size]="size"
          [forceInvalid]="forceInvalid"
        />
        <label hlmLabel for="notifications">Enable notifications</label>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SwitchStoryArgs>;

export const Default: Story = {};

export const Checked: Story = { args: { checked: true } };

export const Small: Story = { args: { size: 'sm', checked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = { args: { disabled: true, checked: true } };

export const Invalid: Story = { args: { forceInvalid: true } };

export const WithDescription: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div class="flex max-w-sm items-start gap-3">
        <hlm-switch inputId="marketing" aria-describedby="marketing-help" [checked]="true" />
        <div class="space-y-1">
          <label hlmLabel for="marketing">Product updates</label>
          <p id="marketing-help" class="text-muted-foreground text-sm">
            Receive an email when new features are released.
          </p>
        </div>
      </div>
    `,
  }),
};
