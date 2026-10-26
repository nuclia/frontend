import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCarouselImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Carousel',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmCarouselImports] })],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a sequence of items that users can browse one slide at a time. Use it for image galleries, featured content, or related items within a limited space.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="mx-auto w-full max-w-2xl px-12">
        <hlm-carousel>
          <hlm-carousel-content>
            <hlm-carousel-item>
              <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-4xl font-semibold">1</div>
            </hlm-carousel-item>
            <hlm-carousel-item>
              <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-4xl font-semibold">2</div>
            </hlm-carousel-item>
            <hlm-carousel-item>
              <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-4xl font-semibold">3</div>
            </hlm-carousel-item>
            <hlm-carousel-item>
              <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-4xl font-semibold">4</div>
            </hlm-carousel-item>
            <hlm-carousel-item>
              <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-4xl font-semibold">5</div>
            </hlm-carousel-item>
          </hlm-carousel-content>
          <button hlm-carousel-previous type="button"></button>
          <button hlm-carousel-next type="button"></button>
        </hlm-carousel>
      </div>
    `,
  }),
};
