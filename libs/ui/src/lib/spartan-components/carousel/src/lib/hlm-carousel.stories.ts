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
          'Simple carousel preview for theme review. See the [official Spartan carousel documentation](https://www.spartan.ng/components/carousel) for implementation guidance.',
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
