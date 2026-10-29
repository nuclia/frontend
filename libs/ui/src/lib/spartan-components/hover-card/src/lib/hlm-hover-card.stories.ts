import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmHoverCardImports } from '../index';
import { HlmHoverCard } from './hlm-hover-card';

type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';

interface HoverCardStoryArgs {
  align: HoverCardSide;
  sideOffset: number;
  showDelay: number;
  hideDelay: number;
  animationDelay: number;
}

const meta: Meta<HoverCardStoryArgs> = {
  title: 'Spartan/Hover Card',
  component: HlmHoverCard,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmHoverCardImports] })],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Shows a richer preview of linked content when users hover over its trigger. Use it for supplemental details, such as a person's profile or a destination summary, without requiring users to leave the page.
Import <code>HlmHoverCardImports</code> from <code>@nuclia/ui-spartan/hover-card</code>.

Wrap the trigger and the card in <code>hlmHoverCard</code>. Put <code>hlmHoverCardTrigger</code> on the element users hover or focus, and render the card with <code>&lt;hlm-hover-card-content *hlmHoverCardPortal&gt;</code> so it is only created in an overlay while open.
The trigger exposes <code>align</code> (side of the trigger where the card appears), <code>sideOffset</code>, <code>showDelay</code>, <code>hideDelay</code> and <code>animationDelay</code> (milliseconds). Alternatively, bind an <code>ng-template</code> with <code>hlmHoverCardTriggerFor</code>.
The card opens on hover and keyboard focus but is not reachable by touch, so never put essential information only in it: the trigger must remain a real link or button.`,
      },
    },
  },
  args: {
    align: 'bottom',
    sideOffset: 5,
    showDelay: 300,
    hideDelay: 500,
    animationDelay: 100,
  },
  argTypes: {
    align: {
      description: 'Side of the trigger where the card is displayed.',
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    sideOffset: {
      description: 'Distance in pixels between the trigger and the card.',
      control: 'number',
    },
    showDelay: {
      description: 'Delay in milliseconds before the card opens.',
      control: 'number',
    },
    hideDelay: {
      description: 'Delay in milliseconds before the card closes after the pointer leaves.',
      control: 'number',
    },
    animationDelay: {
      description: 'Duration in milliseconds of the close animation.',
      control: 'number',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <p class="p-24 text-sm">
        Created by
        <span hlmHoverCard>
          <a
            href="#jordan"
            class="underline underline-offset-4"
            hlmHoverCardTrigger
            [align]="align"
            [sideOffset]="sideOffset"
            [showDelay]="showDelay"
            [hideDelay]="hideDelay"
            [animationDelay]="animationDelay">
            Jordan Lee
          </a>
          <hlm-hover-card-content *hlmHoverCardPortal>
            <article class="flex flex-col gap-2">
              <h2 class="font-semibold">Jordan Lee</h2>
              <p class="text-muted-foreground">Product designer working on collaborative tools.</p>
              <p class="text-xs">Member since March 2023</p>
            </article>
          </hlm-hover-card-content>
        </span>
      </p>
    `,
  }),
};

export default meta;
type Story = StoryObj<HoverCardStoryArgs>;

export const Default: Story = {};

export const Top: Story = {
  args: {
    align: 'top',
  },
};

export const Right: Story = {
  args: {
    align: 'right',
  },
};

export const InstantOpen: Story = {
  args: {
    showDelay: 0,
    hideDelay: 100,
  },
};

export const PreviewProjectLink: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <p class="p-24 text-sm">
        See the
        <span hlmHoverCard>
          <a href="#atlas" class="underline underline-offset-4" hlmHoverCardTrigger>Atlas project</a>
          <hlm-hover-card-content *hlmHoverCardPortal>
            <article class="flex flex-col gap-2">
              <h2 class="font-semibold">Atlas project</h2>
              <p class="text-muted-foreground">A workspace for the upcoming product redesign.</p>
              <p class="text-xs">8 contributors · Updated today</p>
            </article>
          </hlm-hover-card-content>
        </span>
        for more information.
      </p>
    `,
  }),
};
