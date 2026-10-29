import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSliderImports } from '../index';
import { HlmSlider } from './hlm-slider';

interface SliderStoryArgs {
  value: number[];
  min: number;
  max: number;
  step: number;
  orientation: 'horizontal' | 'vertical';
  inverted: boolean;
  showTicks: boolean;
  minStepsBetweenThumbs: number;
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
        component: `Lets users adjust a value or range along a track. Use it for settings such as volume, zoom, or price ranges where the position within a range is more useful than typing an exact value.
Import <code>HlmSliderImports</code> from <code>@nuclia/ui-spartan/slider</code> and use <code>&lt;hlm-slider /&gt;</code>.

The <code>value</code> input is an array: one number renders a single thumb, two numbers render a range with two thumbs. Listen to <code>valueChange</code> for the new array, or bind it with <code>ngModel</code> / reactive forms.
Configure the track with <code>min</code>, <code>max</code>, <code>step</code>, <code>orientation</code>, <code>inverted</code> and <code>showTicks</code>. Always provide an <code>aria-label</code> or <code>aria-labelledby</code>; keyboard arrows, Home and End move the focused thumb.`,
      },
    },
  },
  args: {
    value: [40],
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    inverted: false,
    showTicks: false,
    minStepsBetweenThumbs: 0,
    disabled: false,
  },
  argTypes: {
    value: {
      description: 'Current value(s). One number gives a single thumb, two numbers give a range.',
      control: 'object',
    },
    min: {
      description: 'Lowest value of the track.',
      control: 'number',
    },
    max: {
      description: 'Highest value of the track.',
      control: 'number',
    },
    step: {
      description: 'Increment between selectable values.',
      control: 'number',
    },
    orientation: {
      description: 'Direction of the track.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    inverted: {
      description: 'Reverses the direction in which the value increases.',
      control: 'boolean',
    },
    showTicks: {
      description: 'Shows tick marks with labels under the track.',
      control: 'boolean',
    },
    minStepsBetweenThumbs: {
      description: 'Minimum number of steps that must remain between thumbs of a range slider.',
      control: 'number',
    },
    disabled: {
      description: 'Disables the slider.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div [class]="orientation === 'vertical' ? 'h-56' : 'w-80'">
        <hlm-slider
          aria-label="Volume"
          [value]="value"
          [min]="min"
          [max]="max"
          [step]="step"
          [orientation]="orientation"
          [inverted]="inverted"
          [showTicks]="showTicks"
          [minStepsBetweenThumbs]="minStepsBetweenThumbs"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SliderStoryArgs>;

export const Default: Story = {};

export const Range: Story = {
  args: {
    value: [25, 75],
  },
};

export const WithSteps: Story = {
  args: {
    value: [50],
    step: 10,
    showTicks: true,
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const Inverted: Story = {
  args: {
    inverted: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
