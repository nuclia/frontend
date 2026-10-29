import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSkeletonImports } from '../index';
import { HlmSkeleton } from './hlm-skeleton';

interface SkeletonStoryArgs {
  width: string;
  height: string;
  rounded: string;
}

const meta: Meta<SkeletonStoryArgs> = {
  title: 'Spartan/Skeleton',
  component: HlmSkeleton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSkeletonImports] })],
  parameters: {
    docs: {
      description: {
        component: `A placeholder that mirrors the shape of content while it loads. Use it to preserve the page's visual structure and give users a sense of what will appear.
Import <code>HlmSkeletonImports</code> from <code>@nuclia/ui-spartan/skeleton</code> and apply <code>hlmSkeleton</code> to an element (or use <code>&lt;hlm-skeleton&gt;</code>).

The skeleton has no inputs: set its size and shape with Tailwind classes such as <code>h-4 w-2/3</code> or <code>size-12 rounded-full</code>. The pulse animation is disabled for users who prefer reduced motion.
Skeletons are purely visual: mark them <code>aria-hidden="true"</code> and set <code>aria-busy="true"</code> (plus a label) on the container that is loading.`,
      },
    },
  },
  args: {
    width: 'w-64',
    height: 'h-4',
    rounded: 'rounded-md',
  },
  argTypes: {
    width: {
      description: 'Tailwind width class applied to the skeleton (not an input: the size is set through classes).',
      control: 'select',
      options: ['w-16', 'w-32', 'w-64', 'w-full'],
    },
    height: {
      description: 'Tailwind height class applied to the skeleton.',
      control: 'select',
      options: ['h-2', 'h-4', 'h-8', 'h-24'],
    },
    rounded: {
      description: 'Tailwind border radius class applied to the skeleton.',
      control: 'select',
      options: ['rounded-none', 'rounded-md', 'rounded-xl', 'rounded-full'],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="max-w-md">
        <div hlmSkeleton aria-hidden="true" [class]="width + ' ' + height + ' ' + rounded"></div>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SkeletonStoryArgs>;

export const Default: Story = {};

export const Circle: Story = {
  args: {
    width: 'size-12',
    height: 'size-12',
    rounded: 'rounded-full',
  },
  argTypes: {
    width: { control: 'text' },
    height: { control: 'text' },
  },
};

export const ProfileCard: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <section aria-label="Loading resource details" aria-busy="true" class="max-w-lg space-y-4">
        <div class="flex items-center gap-3">
          <div hlmSkeleton aria-hidden="true" class="size-12 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div hlmSkeleton aria-hidden="true" class="h-4 w-2/3"></div>
            <div hlmSkeleton aria-hidden="true" class="h-3 w-1/3"></div>
          </div>
        </div>
        <div hlmSkeleton aria-hidden="true" class="h-24 w-full rounded-md"></div>
      </section>
    `,
  }),
};

export const TextLines: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div aria-label="Loading search results" aria-busy="true" class="max-w-md space-y-2">
        <div hlmSkeleton aria-hidden="true" class="h-4 w-full"></div>
        <div hlmSkeleton aria-hidden="true" class="h-4 w-full"></div>
        <div hlmSkeleton aria-hidden="true" class="h-4 w-3/4"></div>
      </div>
    `,
  }),
};
