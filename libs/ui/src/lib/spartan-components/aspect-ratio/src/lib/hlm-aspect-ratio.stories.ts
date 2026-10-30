import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAspectRatioImports } from '../index';
import { HlmAspectRatio } from './hlm-aspect-ratio';

interface AspectRatioStoryArgs {
  ratio: string | number;
  caption: string;
}

const meta: Meta<AspectRatioStoryArgs> = {
  title: 'Spartan/Aspect Ratio',
  component: HlmAspectRatio,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAspectRatioImports] })],
  parameters: {
    docs: {
      description: {
        component: `Keeps content at a consistent width-to-height ratio as its container resizes. Use it for images, videos, and media previews that need predictable proportions across layouts.
Import <code>HlmAspectRatioImports</code> from <code>@nuclia/ui-spartan/aspect-ratio</code> and add the <code>hlmAspectRatio</code> directive to a block element.

The directive input takes the ratio as a number (<code>[hlmAspectRatio]="1.5"</code>) or a "width/height" string (<code>hlmAspectRatio="16/9"</code>); invalid or non-positive values fall back to <code>1</code>.
The element must have a width (for example from its container); the height is derived from it. Make child media fill the box, e.g. an <code>img</code> with <code>class="size-full object-cover"</code> and a meaningful <code>alt</code>.`,
      },
    },
  },
  args: {
    ratio: '16/9',
    caption: 'Product demo preview',
  },
  argTypes: {
    ratio: {
      description:
        'Width divided by height, as a number (e.g. <code>1.5</code>) or a "width/height" string (e.g. <code>16/9</code>). Bound to the <code>hlmAspectRatio</code> input.',
      control: 'text',
    },
    caption: {
      description: 'Text rendered inside the box to illustrate the content.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-full max-w-xl">
        <div
          [hlmAspectRatio]="ratio"
          class="from-primary/80 to-primary text-primary-foreground flex items-end overflow-hidden rounded-lg bg-gradient-to-br p-6">
          <p class="font-medium">{{ caption }}</p>
        </div>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AspectRatioStoryArgs>;

export const Default: Story = {};

export const Square: Story = {
  args: { ratio: '1/1', caption: 'Profile picture' },
};

export const Portrait: Story = {
  args: { ratio: '3/4', caption: 'Document page preview' },
};

export const Ultrawide: Story = {
  args: { ratio: '21/9', caption: 'Banner image' },
};

export const NumericRatio: Story = {
  args: { ratio: 1.5, caption: 'Ratio passed as a number (3:2)' },
};

export const WithImage: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="w-full max-w-xl">
        <div hlmAspectRatio="16/9" class="bg-muted overflow-hidden rounded-lg">
          <img
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%2394a3b8'/%3E%3Ccircle cx='120' cy='28' r='10' fill='%23f1f5f9'/%3E%3Cpath d='M0 90 L50 40 L90 70 L120 50 L160 90 Z' fill='%2364748b'/%3E%3C/svg%3E"
            alt="Landscape illustration with mountains and a sun"
            class="size-full object-cover" />
        </div>
      </div>
    `,
  }),
};
