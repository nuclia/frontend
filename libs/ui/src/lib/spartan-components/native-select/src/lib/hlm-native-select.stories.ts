import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmNativeSelectImports } from '../index';
import { HlmNativeSelect } from './hlm-native-select';

interface NativeSelectStoryArgs {
  size: 'default' | 'sm';
  disabled: boolean;
  forceInvalid: boolean;
}

const meta: Meta<NativeSelectStoryArgs> = {
  title: 'Spartan/Native Select',
  component: HlmNativeSelect,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmNativeSelectImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Lets users choose an option through the browser's built-in select control. Use it for straightforward choices where familiar platform behavior, including the mobile picker, is preferred.
Import <code>HlmNativeSelectImports</code> from <code>@nuclia/ui-spartan/native-select</code> and place native <code>&lt;option&gt;</code> elements inside <code>hlm-native-select</code>.

Add <code>hlmNativeSelectOption</code> to options and <code>hlmNativeSelectOptGroup</code> to <code>&lt;optgroup&gt;</code> elements so they follow the theme colors in the browser popup.
The component is a form control: bind it with <code>ngModel</code> or reactive forms, or use <code>value</code> and <code>valueChange</code>. Give it an accessible name by pairing <code>selectId</code> with a <code>&lt;label for&gt;</code>.`,
      },
    },
  },
  args: { size: 'default', disabled: false, forceInvalid: false },
  argTypes: {
    size: {
      description: 'Height of the select.',
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
    disabled: {
      description: 'Disables the select.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state.',
      control: 'boolean',
    },
  },
  render: ({ size, disabled, forceInvalid }) => ({
    props: { size, disabled, forceInvalid },
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="plan">Plan</label>
        <hlm-native-select selectId="plan" [size]="size" [disabled]="disabled" [forceInvalid]="forceInvalid">
          <option value="" disabled selected>Select a plan</option>
          <option hlmNativeSelectOption value="starter">Starter</option>
          <option hlmNativeSelectOption value="team">Team</option>
          <option hlmNativeSelectOption value="enterprise">Enterprise</option>
        </hlm-native-select>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<NativeSelectStoryArgs>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = { args: { forceInvalid: true } };

export const WithOptionGroups: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="timezone">Time zone</label>
        <hlm-native-select selectId="timezone">
          <option value="" disabled selected>Select a time zone</option>
          <optgroup hlmNativeSelectOptGroup label="Americas">
            <option hlmNativeSelectOption value="america-los-angeles">Los Angeles</option>
            <option hlmNativeSelectOption value="america-new-york">New York</option>
          </optgroup>
          <optgroup hlmNativeSelectOptGroup label="Europe">
            <option hlmNativeSelectOption value="europe-london">London</option>
            <option hlmNativeSelectOption value="europe-paris">Paris</option>
          </optgroup>
        </hlm-native-select>
      </div>
    `,
  }),
};

export const WithDisabledOption: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="region">Data region</label>
        <hlm-native-select selectId="region" value="europe">
          <option hlmNativeSelectOption value="europe">Europe (Frankfurt)</option>
          <option hlmNativeSelectOption value="us">United States (Virginia)</option>
          <option hlmNativeSelectOption value="asia" disabled>Asia (coming soon)</option>
        </hlm-native-select>
      </div>
    `,
  }),
};
