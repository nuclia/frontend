import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '../../../button/src/index';
import { HlmCardImports } from '../index';
import { HlmCard } from './hlm-card';

interface CardStoryArgs {
  size: 'default' | 'sm';
  title: string;
  description: string;
}

const meta: Meta<CardStoryArgs> = {
  title: 'Spartan/Card',
  component: HlmCard,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmCardImports, ...HlmButtonImports, NgIcon],
      providers: [provideIcons({ lucideEllipsis })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Groups related information and actions in a distinct surface. Use cards for summaries, settings, or self-contained content that needs a clear visual boundary within a page.
Import <code>HlmCardImports</code> from <code>@nuclia/ui-spartan/card</code> and compose <code>hlmCard</code> with <code>hlmCardHeader</code> (<code>hlmCardTitle</code>, <code>hlmCardDescription</code>, optional <code>hlmCardAction</code>), <code>hlmCardContent</code> and <code>hlmCardFooter</code>.
Set <code>size</code> to <code>sm</code> for tighter spacing; the default can also be changed for a whole subtree with <code>provideHlmCardConfig</code>. A leading <code>img</code> is flush with the top edge of the card.

Cards have no implicit semantics: use a <code>section</code> or <code>article</code> element with a heading as the title, and give icon-only actions an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    size: 'default',
    title: 'Workspace activity',
    description: 'Recent work in the research workspace.',
  },
  argTypes: {
    size: {
      description: 'Spacing of the card. <code>sm</code> is more compact.',
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
    title: {
      description: 'Heading shown in <code>hlmCardTitle</code>.',
      control: 'text',
    },
    description: {
      description: 'Supporting text shown in <code>hlmCardDescription</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCard [size]="size" class="w-full max-w-md">
        <header hlmCardHeader>
          <h2 hlmCardTitle>{{ title }}</h2>
          <p hlmCardDescription>{{ description }}</p>
        </header>
        <div hlmCardContent><p>12 resources were added this week.</p></div>
        <footer hlmCardFooter><span class="text-muted-foreground">Updated just now</span></footer>
      </section>
    `,
  }),
};

export default meta;

type Story = StoryObj<CardStoryArgs>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const WithAction: Story = {
  args: {
    description: 'Review the latest resource changes.',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCard [size]="size" class="w-full max-w-md">
        <header hlmCardHeader>
          <h2 hlmCardTitle>{{ title }}</h2>
          <p hlmCardDescription>{{ description }}</p>
          <button hlmCardAction hlmBtn variant="ghost" size="icon-sm" type="button" aria-label="More workspace activity options">
            <ng-icon name="lucideEllipsis" />
          </button>
        </header>
        <div hlmCardContent><p>12 resources were added this week.</p></div>
      </section>
    `,
  }),
};

export const WithFooterActions: Story = {
  args: {
    title: 'Delete knowledge box',
    description: 'This removes all resources and cannot be undone.',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCard [size]="size" class="w-full max-w-md">
        <header hlmCardHeader>
          <h2 hlmCardTitle>{{ title }}</h2>
          <p hlmCardDescription>{{ description }}</p>
        </header>
        <div hlmCardContent><p>The knowledge box "Support articles" contains 248 resources.</p></div>
        <footer hlmCardFooter class="justify-end gap-2">
          <button hlmBtn variant="outline" type="button">Cancel</button>
          <button hlmBtn variant="destructive" type="button">Delete</button>
        </footer>
      </section>
    `,
  }),
};

export const WithImage: Story = {
  args: {
    title: 'Getting started with search',
    description: 'Learn how to index your first documents.',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCard [size]="size" class="w-full max-w-md">
        <img
          src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%2394a3b8'/%3E%3Ccircle cx='120' cy='28' r='10' fill='%23f1f5f9'/%3E%3Cpath d='M0 90 L50 40 L90 70 L120 50 L160 90 Z' fill='%2364748b'/%3E%3C/svg%3E"
          alt="Illustration of mountains under a bright sun"
          class="aspect-video w-full object-cover" />
        <header hlmCardHeader>
          <h2 hlmCardTitle>{{ title }}</h2>
          <p hlmCardDescription>{{ description }}</p>
        </header>
      </section>
    `,
  }),
};

export const ContentOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <section hlmCard class="w-full max-w-md" aria-label="Storage usage">
        <div hlmCardContent><p>You have used 3.2 GB of your 10 GB storage.</p></div>
      </section>
    `,
  }),
};
