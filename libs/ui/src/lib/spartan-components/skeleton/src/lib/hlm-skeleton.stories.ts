import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSkeletonImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Skeleton',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSkeletonImports] })],
  parameters: {
    docs: {
      description: {
        component: `A placeholder that mirrors the shape of content while it loads. Use it to preserve the page's visual structure and give users a sense of what will appear.`,
      },
    },
  },
  render: () => ({
    template: `<section aria-label="Loading resource details" aria-busy="true" class="max-w-lg space-y-4">
      <div class="flex items-center gap-3">
        <div hlmSkeleton aria-hidden="true" class="size-12 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div hlmSkeleton aria-hidden="true" class="h-4 w-2/3"></div>
          <div hlmSkeleton aria-hidden="true" class="h-3 w-1/3"></div>
        </div>
      </div>
      <div hlmSkeleton aria-hidden="true" class="h-24 w-full rounded-md"></div>
    </section>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
