import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAspectRatioImports } from '../index';

interface AspectRatioStoryArgs {
  ratio: string;
}

const meta: Meta<AspectRatioStoryArgs> = {
  title: 'Spartan/Aspect Ratio',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAspectRatioImports] })],
  parameters: {
    docs: {
      description: {
        component: `Keeps content at a consistent width-to-height ratio as its container resizes. Use it for images, videos, and media previews that need predictable proportions across layouts.`,
      },
    },
  },
  args: { ratio: '16/9' },
  argTypes: { ratio: { control: 'text', description: 'Width divided by height, such as 16/9.' } },
  render: ({ ratio }) => ({
    props: { ratio },
    template: `<div hlmAspectRatio [hlmAspectRatio]="ratio" class="flex max-w-xl items-end overflow-hidden rounded-lg bg-gradient-to-br from-primary/80 to-primary p-6 text-primary-foreground">
      <p class="font-medium">A steady canvas for responsive media</p>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<AspectRatioStoryArgs>;
export const Default: Story = {};
export const Square: Story = { args: { ratio: '1/1' } };
export const Portrait: Story = { args: { ratio: '3/4' } };
