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
        component: `Lets users adjust a value or range along a track. Use it for settings such as volume, zoom, or price ranges where the position within a range is more useful than typing an exact value.`,
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
