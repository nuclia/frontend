import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCarouselImports } from '../index';
import { HlmCarousel } from './hlm-carousel';

interface CarouselStoryArgs {
  orientation: 'horizontal' | 'vertical';
  loop: boolean;
  align: 'start' | 'center' | 'end';
}

interface Slide {
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  { title: 'Getting started', description: 'Create a knowledge box and upload your first documents.' },
  { title: 'Connect your data', description: 'Sync files from cloud storage or a website.' },
  { title: 'Search and ask', description: 'Query your content with semantic search and generative answers.' },
  { title: 'Tune relevance', description: 'Adjust filters and ranking to improve results.' },
  { title: 'Share with your team', description: 'Invite collaborators and manage access.' },
];

const meta: Meta<CarouselStoryArgs> = {
  title: 'Spartan/Carousel',
  component: HlmCarousel,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmCarouselImports] })],
  parameters: {
    docs: {
      description: {
        component: `Displays a sequence of items that users can browse one slide at a time. Use it for image galleries, featured content, or related items within a limited space.
Import <code>HlmCarouselImports</code> from <code>@nuclia/ui-spartan/carousel</code> and compose <code>hlm-carousel</code> with <code>hlm-carousel-content</code> holding one <code>hlm-carousel-item</code> per slide, plus <code>button[hlmCarouselPrevious]</code> and <code>button[hlmCarouselNext]</code> to navigate and an optional <code>hlm-carousel-slide-display</code> showing "current / total".
The carousel is built on Embla: <code>orientation</code> sets the scroll axis, <code>options</code> takes Embla options (<code>loop</code>, <code>align</code>, ...) and <code>plugins</code> takes Embla plugins such as autoplay. Set the slide width with a <code>basis-*</code> class on the items.

The host is a <code>region</code> with <code>aria-roledescription="carousel"</code> (add an <code>aria-label</code>), slides are announced as groups, and the left/right arrow keys scroll when the carousel has focus. Reserve horizontal space (for example <code>px-12</code>) for the arrows, which sit outside the slides.`,
      },
    },
  },
  args: {
    orientation: 'horizontal',
    loop: false,
    align: 'start',
  },
  argTypes: {
    orientation: {
      description: 'Scroll direction of the carousel.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    loop: {
      description: 'Embla option: continue from the last slide back to the first one.',
      control: 'boolean',
    },
    align: {
      description: 'Embla option: how the active slide is aligned within the viewport.',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
  },
  render: (args) => ({
    props: { ...args, slides: SLIDES },
    template: `
      <div class="mx-auto w-full max-w-md" [class.px-12]="orientation === 'horizontal'" [class.py-14]="orientation === 'vertical'">
        <hlm-carousel aria-label="Product guides" [orientation]="orientation" [options]="{ loop: loop, align: align }">
          <hlm-carousel-content [class.h-52]="orientation === 'vertical'">
            @for (slide of slides; track slide.title) {
              <hlm-carousel-item>
                <div class="bg-muted flex h-48 flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center">
                  <p class="text-lg font-semibold">{{ slide.title }}</p>
                  <p class="text-muted-foreground text-sm">{{ slide.description }}</p>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlmCarouselPrevious type="button"></button>
          <button hlmCarouselNext type="button"></button>
        </hlm-carousel>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<CarouselStoryArgs>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const Loop: Story = {
  args: {
    loop: true,
  },
};

export const MultipleSlidesPerView: Story = {
  render: (args) => ({
    props: { ...args, slides: SLIDES },
    template: `
      <div class="mx-auto w-full max-w-2xl px-12">
        <hlm-carousel aria-label="Product guides" [options]="{ loop: loop, align: align }">
          <hlm-carousel-content>
            @for (slide of slides; track slide.title) {
              <hlm-carousel-item class="basis-1/2">
                <div class="bg-muted flex h-40 flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center">
                  <p class="font-semibold">{{ slide.title }}</p>
                  <p class="text-muted-foreground text-sm">{{ slide.description }}</p>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlmCarouselPrevious type="button"></button>
          <button hlmCarouselNext type="button"></button>
        </hlm-carousel>
      </div>
    `,
  }),
};

export const WithSlideDisplay: Story = {
  render: (args) => ({
    props: { ...args, slides: SLIDES },
    template: `
      <div class="mx-auto w-full max-w-md px-12">
        <hlm-carousel aria-label="Product guides" [orientation]="orientation" [options]="{ loop: loop, align: align }">
          <hlm-carousel-content>
            @for (slide of slides; track slide.title) {
              <hlm-carousel-item>
                <div class="bg-muted flex h-48 flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center">
                  <p class="text-lg font-semibold">{{ slide.title }}</p>
                  <p class="text-muted-foreground text-sm">{{ slide.description }}</p>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlmCarouselPrevious type="button"></button>
          <button hlmCarouselNext type="button"></button>
          <hlm-carousel-slide-display class="mt-3 flex justify-center" label="Guide" />
        </hlm-carousel>
      </div>
    `,
  }),
};
