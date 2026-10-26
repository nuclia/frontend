import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmNativeSelectImports } from '../index';
import { HlmNativeSelect } from './hlm-native-select';

interface NativeSelectStoryArgs {
  size: 'default' | 'sm';
  disabled: boolean;
}

const meta: Meta<NativeSelectStoryArgs> = {
  title: 'Spartan/Native Select',
  component: HlmNativeSelect,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmNativeSelectImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Lets users choose an option through the browser's built-in select control. Use it for straightforward choices where familiar platform behavior, including the mobile picker, is preferred.`,
      },
    },
  },
  args: { size: 'default', disabled: false },
  argTypes: {
    size: { control: 'select', options: ['default', 'sm'] },
    disabled: { control: 'boolean' },
  },
  render: ({ size, disabled }) => ({
    props: { size, disabled },
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="timezone">Time zone</label>
        <hlm-native-select selectId="timezone" [size]="size" [disabled]="disabled">
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

export default meta;

type Story = StoryObj<NativeSelectStoryArgs>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

export const Disabled: Story = { args: { disabled: true } };
