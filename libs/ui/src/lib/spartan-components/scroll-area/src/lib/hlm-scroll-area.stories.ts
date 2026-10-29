import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NgScrollbar } from 'ngx-scrollbar';
import { HlmScrollAreaImports } from '../index';
import { HlmScrollArea } from './hlm-scroll-area';

interface ScrollAreaStoryArgs {
  orientation: 'auto' | 'vertical' | 'horizontal';
  visibility: 'native' | 'hover' | 'visible';
  appearance: 'native' | 'compact';
}

const activities = [
  { title: 'Project created', detail: 'Jordan created Atlas redesign.' },
  { title: 'A teammate joined', detail: 'Sam joined the Product workspace.' },
  { title: 'Report updated', detail: 'The weekly progress report is ready.' },
  { title: 'Review scheduled', detail: 'The design review is scheduled for Thursday.' },
  { title: 'Comment added', detail: 'Priya commented on the onboarding flow.' },
  { title: 'File uploaded', detail: 'Quarterly-metrics.pdf was added to Documents.' },
  { title: 'Task completed', detail: 'Alex finished the accessibility audit.' },
  { title: 'Invitation sent', detail: 'Morgan invited two reviewers.' },
];

const meta: Meta<ScrollAreaStoryArgs> = {
  title: 'Spartan/Scroll Area',
  component: HlmScrollArea,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NgScrollbar, ...HlmScrollAreaImports] })],
  parameters: {
    docs: {
      description: {
        component: `Contains overflowing content in a scrollable region with consistently styled scrollbars. Use it for long lists or panels that need to stay within a fixed area of the layout.
Import <code>HlmScrollAreaImports</code> from <code>@nuclia/ui-spartan/scroll-area</code> and add the <code>hlm</code> attribute to an <code>ng-scrollbar</code> element (also import <code>NgScrollbar</code> from <code>ngx-scrollbar</code>). The directive applies the Spartan track and thumb styles.

Give the element a fixed height or width so the content can overflow. Inputs such as <code>orientation</code>, <code>visibility</code>, <code>appearance</code> and <code>position</code> come from <code>ngx-scrollbar</code>, and it emits <code>afterInit</code> and <code>afterUpdate</code>.
The scrolling happens in a native container, so keyboard and screen reader behaviour is preserved; label the region when it holds standalone content.`,
      },
    },
  },
  args: {
    orientation: 'auto',
    visibility: 'hover',
    appearance: 'native',
  },
  argTypes: {
    orientation: {
      description: 'Axis on which the scrollbar is shown; auto picks it from the content overflow.',
      control: 'inline-radio',
      options: ['auto', 'vertical', 'horizontal'],
    },
    visibility: {
      description: 'When the scrollbar is displayed: native, only on hover, or always visible.',
      control: 'inline-radio',
      options: ['native', 'hover', 'visible'],
    },
    appearance: {
      description: 'Native keeps space for the scrollbar, compact overlays it on the content.',
      control: 'inline-radio',
      options: ['native', 'compact'],
    },
  },
  render: (args) => ({
    props: { ...args, activities },
    template: `
      <ng-scrollbar
        hlm
        class="h-56 w-full max-w-sm rounded-md border"
        [orientation]="orientation"
        [visibility]="visibility"
        [appearance]="appearance">
        <div class="space-y-4 p-4">
          <h2 class="font-semibold">Workspace activity</h2>
          @for (activity of activities; track activity.title) {
            <article>
              <h3 class="font-medium">{{ activity.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ activity.detail }}</p>
            </article>
          }
        </div>
      </ng-scrollbar>
    `,
  }),
};

export default meta;
type Story = StoryObj<ScrollAreaStoryArgs>;

export const Default: Story = {};

export const AlwaysVisible: Story = {
  args: { visibility: 'visible' },
};

export const Compact: Story = {
  args: { appearance: 'compact', visibility: 'visible' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => ({
    props: {
      ...args,
      images: ['Mountains', 'Coastline', 'Forest', 'Desert', 'Glacier', 'Canyon', 'Meadow', 'Island'],
    },
    template: `
      <ng-scrollbar
        hlm
        class="w-full max-w-sm rounded-md border"
        [orientation]="orientation"
        [visibility]="visibility"
        [appearance]="appearance">
        <div class="flex gap-4 p-4">
          @for (image of images; track image) {
            <figure class="shrink-0">
              <div class="bg-muted h-24 w-32 rounded-md"></div>
              <figcaption class="text-muted-foreground pt-2 text-xs">{{ image }}</figcaption>
            </figure>
          }
        </div>
      </ng-scrollbar>
    `,
  }),
};

export const BothAxes: Story = {
  args: { orientation: 'auto', visibility: 'visible' },
  render: (args) => ({
    props: args,
    template: `
      <ng-scrollbar
        hlm
        class="h-48 w-full max-w-sm rounded-md border"
        [orientation]="orientation"
        [visibility]="visibility"
        [appearance]="appearance">
        <div class="w-[40rem] space-y-3 p-4">
          <h2 class="font-semibold">Quarterly revenue</h2>
          <p class="text-sm">Q1: $1.2M &middot; Q2: $1.4M &middot; Q3: $1.1M &middot; Q4: $1.8M &middot; Forecast: $2.0M</p>
          <p class="text-sm text-muted-foreground">Scroll in both directions to read the whole summary.</p>
          <p class="text-sm">Revenue grew in three of four quarters, driven mainly by new enterprise subscriptions.</p>
          <p class="text-sm">Customer retention stayed above 94% throughout the year across all regions.</p>
          <p class="text-sm text-muted-foreground">Figures are updated nightly from the finance system.</p>
        </div>
      </ng-scrollbar>
    `,
  }),
};
