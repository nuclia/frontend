import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileSearch, lucideFolderOpen } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmEmptyImports } from '../index';
import { HlmEmpty } from './hlm-empty';

interface EmptyStoryArgs {
  mediaVariant: 'default' | 'icon';
  title: string;
  description: string;
  actionLabel: string;
}

const meta: Meta<EmptyStoryArgs> = {
  title: 'Spartan/Empty',
  component: HlmEmpty,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmEmptyImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideFolderOpen, lucideFileSearch })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Explain why an area has no content and guide users toward a useful next step. Use it for first-use experiences, empty collections or searches with no results.
Import <code>HlmEmptyImports</code> from <code>@nuclia/ui-spartan/empty</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for actions).

Compose <code>hlmEmpty</code> with <code>hlmEmptyHeader</code> (containing an optional <code>hlmEmptyMedia</code>, <code>hlmEmptyTitle</code> and <code>hlmEmptyDescription</code>) and an optional <code>hlmEmptyContent</code> for actions.
<code>hlmEmptyMedia</code> has a <code>variant</code> input: <code>default</code> (bare icon or illustration) or <code>icon</code> (icon in a muted rounded box). Decorative icons should be hidden from assistive technology.
Each part also exists as an element selector (<code>hlm-empty</code>, <code>hlm-empty-header</code>, …) except title and description.`,
      },
    },
  },
  args: {
    mediaVariant: 'icon',
    title: 'No resources yet',
    description: 'Add a document to start building your knowledge base.',
    actionLabel: 'Add a document',
  },
  argTypes: {
    mediaVariant: {
      description: 'Variant of the media slot (<code>hlmEmptyMedia</code> input).',
      control: 'inline-radio',
      options: ['default', 'icon'],
    },
    title: {
      description: 'Title of the empty state (story-only argument).',
      control: 'text',
    },
    description: {
      description: 'Explanation shown under the title (story-only argument).',
      control: 'text',
    },
    actionLabel: {
      description: 'Label of the call-to-action button (story-only argument).',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmEmpty class="mx-auto max-w-md">
        <header hlmEmptyHeader>
          <div hlmEmptyMedia [variant]="mediaVariant" aria-hidden="true">
            <ng-icon name="lucideFolderOpen" />
          </div>
          <h2 hlmEmptyTitle>{{ title }}</h2>
          <p hlmEmptyDescription>{{ description }}</p>
        </header>
        <div hlmEmptyContent>
          <button type="button" hlmBtn>{{ actionLabel }}</button>
        </div>
      </section>
    `,
  }),
};

export default meta;
type Story = StoryObj<EmptyStoryArgs>;

export const Default: Story = {};

export const BareMedia: Story = {
  args: {
    mediaVariant: 'default',
  },
};

export const NoSearchResults: Story = {
  args: {
    title: 'No matching resources',
    description: 'Try a different phrase or clear the active filters.',
    actionLabel: 'Clear filters',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmEmpty class="mx-auto max-w-md">
        <header hlmEmptyHeader>
          <div hlmEmptyMedia [variant]="mediaVariant" aria-hidden="true">
            <ng-icon name="lucideFileSearch" />
          </div>
          <h2 hlmEmptyTitle>{{ title }}</h2>
          <p hlmEmptyDescription>{{ description }}</p>
        </header>
        <div hlmEmptyContent>
          <button type="button" hlmBtn variant="outline">{{ actionLabel }}</button>
        </div>
      </section>
    `,
  }),
};

export const Bordered: Story = {
  args: {
    title: 'No API keys',
    description: 'Create a key to access your knowledge box from your own applications.',
    actionLabel: 'Create API key',
  },
  render: (args) => ({
    props: args,
    template: `
      <section hlmEmpty class="mx-auto max-w-md border">
        <header hlmEmptyHeader>
          <h2 hlmEmptyTitle>{{ title }}</h2>
          <p hlmEmptyDescription>{{ description }}</p>
        </header>
        <div hlmEmptyContent>
          <button type="button" hlmBtn size="sm">{{ actionLabel }}</button>
        </div>
      </section>
    `,
  }),
};
