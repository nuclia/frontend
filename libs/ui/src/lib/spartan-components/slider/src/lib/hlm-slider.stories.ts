import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSliderImports } from '../index';
import { HlmSlider } from './hlm-slider';

interface SliderStoryArgs {
  value: number[];
  min: number;
  max: number;
  disabled: boolean;
}

const meta: Meta<SliderStoryArgs> = {
  title: 'Spartan/Slider',
  component: HlmSlider,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSliderImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmSlider</code> or <code>HlmSliderImports</code> from <code>@nuclia/ui-spartan/slider</code>. Bind a numeric array to <code>value</code>; arrays with one value render a single thumb and arrays with two values render a range.
Set a meaningful accessible label, and provide suitable <code>min</code>, <code>max</code>, and <code>step</code> values. The slider supports keyboard adjustment and exposes the current value.`,
      },
    },
  },
  args: { value: [40], min: 0, max: 100, disabled: false },
  argTypes: {
    value: { control: 'object' },
    min: { control: 'number' },
    max: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  render: ({ value, min, max, disabled }) => ({
    props: { value, min, max, disabled },
    template: `<hlm-slider aria-label="Volume" [value]="value" [min]="min" [max]="max" [disabled]="disabled" />`,
  }),
};

export default meta;

type Story = StoryObj<SliderStoryArgs>;

export const Default: Story = {};

export const Range: Story = { args: { value: [25, 75] } };

export const Disabled: Story = { args: { disabled: true } };
