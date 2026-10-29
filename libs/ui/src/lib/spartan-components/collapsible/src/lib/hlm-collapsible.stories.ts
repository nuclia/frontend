import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmCollapsibleImports } from '../index';
import { HlmCollapsible } from './hlm-collapsible';

interface CollapsibleStoryArgs {
  expanded: boolean;
  disabled: boolean;
  title: string;
  content: string;
}

const meta: Meta<CollapsibleStoryArgs> = {
  title: 'Spartan/Collapsible',
  component: HlmCollapsible,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HlmButton, NgIcon, ...HlmCollapsibleImports],
      providers: [provideIcons({ lucideChevronsUpDown })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Reveal or hide a single section of content. Use it for optional details or advanced settings that should remain available without taking up space by default.
Import <code>HlmCollapsibleImports</code> from <code>@nuclia/ui-spartan/collapsible</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for a styled trigger).

Put <code>hlmCollapsible</code> on a wrapper, a <code>button[hlmCollapsibleTrigger]</code> inside it to toggle, and <code>hlmCollapsibleContent</code> on the section to show or hide.
Use <code>expanded</code> to set the initial state (it supports two-way binding with <code>[(expanded)]</code>), <code>expandedChange</code> to react to changes and <code>disabled</code> to lock the section.
The trigger is a real button, so give icon-only triggers an <code>aria-label</code>. For several related sections where one stays open, use an accordion instead.`,
      },
    },
  },
  args: {
    expanded: false,
    disabled: false,
    title: 'Project details',
    content: 'The Atlas project brings product, design and engineering planning together in a single roadmap.',
  },
  argTypes: {
    expanded: {
      description: 'Whether the content is visible. Supports two-way binding.',
      control: 'boolean',
    },
    disabled: {
      description: 'Prevents the user from toggling the collapsible.',
      control: 'boolean',
    },
    title: {
      description: 'Heading displayed next to the trigger (story-only argument).',
      control: 'text',
    },
    content: {
      description: 'Text revealed by the collapsible (story-only argument).',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCollapsible [expanded]="expanded" [disabled]="disabled" class="w-full max-w-md space-y-2">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-sm font-medium">{{ title }}</h2>
          <button type="button" hlmBtn variant="outline" size="sm" hlmCollapsibleTrigger>Toggle details</button>
        </div>
        <div hlmCollapsibleContent>
          <p class="rounded-md border px-4 py-3 text-sm">{{ content }}</p>
        </div>
      </section>
    `,
  }),
};

export default meta;
type Story = StoryObj<CollapsibleStoryArgs>;

export const Default: Story = {};

export const InitiallyExpanded: Story = {
  args: {
    expanded: true,
    title: 'Release notes',
    content: 'Version 2.4 improves keyboard navigation and adds clearer empty states.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    title: 'Advanced settings',
    content: 'Advanced settings are available once the knowledge box has at least one resource.',
  },
};

export const WithIconTrigger: Story = {
  args: {
    title: 'Starred repositories',
    content: 'nuclia/frontend',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmCollapsible [expanded]="expanded" [disabled]="disabled" class="w-full max-w-md space-y-2">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-sm font-semibold">{{ title }}</h2>
          <button type="button" hlmBtn variant="ghost" size="icon-sm" hlmCollapsibleTrigger aria-label="Toggle starred repositories">
            <ng-icon name="lucideChevronsUpDown" />
          </button>
        </div>
        <div class="rounded-md border px-4 py-2 font-mono text-sm">nuclia/nucliadb</div>
        <div hlmCollapsibleContent class="space-y-2">
          <div class="rounded-md border px-4 py-2 font-mono text-sm">{{ content }}</div>
          <div class="rounded-md border px-4 py-2 font-mono text-sm">nuclia/nuclia.js</div>
        </div>
      </section>
    `,
  }),
};
