import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { UiInfiniteScrollImports } from '../index';
import { UiInfiniteScroll } from './ui-infinite-scroll';

interface InfiniteScrollStoryArgs {
  rootMargin: string;
  disabled: boolean;
}

const meta: Meta<InfiniteScrollStoryArgs> = {
  title: 'PDP-UI/Infinite scroll',
  component: UiInfiniteScroll,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...UiInfiniteScrollImports] })],
  parameters: {
    docs: {
      description: {
        component: `Emits <code>reachAnchor</code> when an invisible anchor placed after a list scrolls into view, so the list can render more items.
Import <code>UiInfiniteScrollImports</code> from <code>@nuclia/ui/infinite-scroll</code>.

Put <code>&lt;ui-infinite-scroll&gt;</code> right after the last item and handle <code>(reachAnchor)</code> by increasing the number of rendered items. The anchor is observed again after each render, so it keeps emitting while it stays visible. Use <code>disabled</code> once every item is rendered and <code>rootMargin</code> to start loading before the anchor is actually visible.`,
      },
    },
  },
  args: {
    rootMargin: '200px',
    disabled: false,
  },
  argTypes: {
    rootMargin: {
      description: 'Margin around the viewport used to anticipate the anchor becoming visible.',
      control: 'text',
    },
    disabled: {
      description: 'Stops <code>reachAnchor</code> from being emitted.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: { ...args, count: 20, range: (size: number) => Array.from({ length: size }) },
    template: `
      <div class="h-64 overflow-y-auto rounded-md border">
        <ul class="divide-y">
          @for (item of range(count); track $index) {
            <li class="px-3 py-2 text-sm">Item {{ $index + 1 }}</li>
          }
        </ul>
        <ui-infinite-scroll [rootMargin]="rootMargin" [disabled]="disabled" (reachAnchor)="count = count + 20" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<InfiniteScrollStoryArgs>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
