import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmHoverCardImports } from '../index';
import { HlmHoverCard } from './hlm-hover-card';

const meta: Meta = {
  title: 'Spartan/Hover Card',
  component: HlmHoverCard,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmHoverCardImports] })],
  parameters: {
    docs: {
      description: {
        component: `Shows a richer preview of linked content when users hover over its trigger. Use it for supplemental details, such as a person's profile or a destination summary, without requiring users to leave the page.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <p class="text-sm">
        Created by
        <span hlmHoverCard>
          <a href="#jordan" hlmHoverCardTrigger>Jordan Lee</a>
          <hlm-hover-card-content *hlmHoverCardPortal="let context">
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

export const PreviewProjectLink: Story = {
  render: () => ({
    template: `
      <p class="text-sm">
        See the
        <span hlmHoverCard>
          <a href="#atlas" hlmHoverCardTrigger>Atlas project</a>
          <hlm-hover-card-content *hlmHoverCardPortal="let context">
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
