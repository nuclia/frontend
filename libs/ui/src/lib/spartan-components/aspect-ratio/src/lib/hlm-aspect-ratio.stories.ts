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
        component: `Import <code>HlmAspectRatioImports</code> from <code>@nuclia/ui-spartan/aspect-ratio</code>. Apply <code>hlmAspectRatio</code> to a container and pass a width/height ratio (number or ratio string such as <code>16/9</code>). It reserves a stable box for projected content; give images useful alt text and use an empty alt only for decorative images.`,
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
