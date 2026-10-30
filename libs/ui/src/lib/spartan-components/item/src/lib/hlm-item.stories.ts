import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideFileText, lucideMusic } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmItemImports } from '../index';
import { HlmItem } from './hlm-item';

interface ItemStoryArgs {
  variant: 'default' | 'outline' | 'muted';
  size: 'default' | 'sm' | 'xs';
  title: string;
  description: string;
}

const meta: Meta<ItemStoryArgs> = {
  title: 'Spartan/Item',
  component: HlmItem,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmItemImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideChevronRight, lucideFileText, lucideMusic })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Presents a single entry with optional media, a title, supporting text, and actions. Use it for consistent rows in lists of people, files, settings, or other related content.
Import <code>HlmItemImports</code> from <code>@nuclia/ui-spartan/item</code>.

Compose <code>hlmItem</code> with <code>hlmItemMedia</code> (<code>variant</code>: <code>default</code>, <code>icon</code> or <code>image</code>), <code>hlmItemContent</code> holding <code>hlmItemTitle</code> and <code>hlmItemDescription</code>, and <code>hlmItemActions</code>. <code>hlmItemHeader</code> and <code>hlmItemFooter</code> add full-width rows above and below.
Stack several items in <code>hlmItemGroup</code>, optionally separated by <code>hlmItemSeparator</code>. <code>variant</code> (<code>default</code>, <code>outline</code>, <code>muted</code>) and <code>size</code> (<code>default</code>, <code>sm</code>, <code>xs</code>) are set on the item; defaults can be provided with <code>provideHlmItemConfig</code>.
Use an <code>a[hlmItem]</code> element to make the whole row a link (it gets a hover style), and give icon-only actions an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    variant: 'outline',
    size: 'default',
    title: 'Research summary',
    description: 'Updated today · 8 pages',
  },
  argTypes: {
    variant: {
      description: 'Visual style of the item.',
      control: 'select',
      options: ['default', 'outline', 'muted'],
    },
    size: {
      description: 'Density of the item. <code>xs</code> is the most compact.',
      control: 'select',
      options: ['default', 'sm', 'xs'],
    },
    title: {
      description: 'Text of <code>hlmItemTitle</code>.',
      control: 'text',
    },
    description: {
      description: 'Text of <code>hlmItemDescription</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmItem [variant]="variant" [size]="size" class="max-w-xl">
        <div hlmItemMedia variant="icon">
          <ng-icon name="lucideFileText" />
        </div>
        <div hlmItemContent>
          <div hlmItemTitle>{{ title }}</div>
          <p hlmItemDescription>{{ description }}</p>
        </div>
        <div hlmItemActions>
          <button hlmBtn variant="outline" size="sm" type="button">Open</button>
        </div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<ItemStoryArgs>;

export const Default: Story = {};

export const Plain: Story = {
  args: { variant: 'default' },
};

export const Muted: Story = {
  args: { variant: 'muted' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Compact: Story = {
  args: { size: 'xs' },
};

export const AsLink: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <a hlmItem variant="outline" href="#interview" class="max-w-xl">
        <div hlmItemMedia variant="icon">
          <ng-icon name="lucideMusic" />
        </div>
        <div hlmItemContent>
          <div hlmItemTitle>Interview recording</div>
          <p hlmItemDescription>Added yesterday · Audio · 42 minutes</p>
        </div>
        <div hlmItemActions>
          <ng-icon name="lucideChevronRight" />
        </div>
      </a>
    `,
  }),
};

export const WithHeaderAndFooter: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmItem variant="outline" class="max-w-xl">
        <div hlmItemHeader>
          <span class="text-muted-foreground text-xs">Knowledge box</span>
          <span class="text-muted-foreground text-xs">Processed</span>
        </div>
        <div hlmItemContent>
          <div hlmItemTitle>Product documentation</div>
          <p hlmItemDescription>Manuals and release notes imported from the support portal.</p>
        </div>
        <div hlmItemFooter>
          <span class="text-muted-foreground text-xs">1,248 resources</span>
          <button hlmBtn variant="ghost" size="xs" type="button">View details</button>
        </div>
      </div>
    `,
  }),
};

export const Group: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmItemGroup class="max-w-xl">
        <div hlmItem variant="default">
          <div hlmItemMedia variant="icon">
            <ng-icon name="lucideFileText" />
          </div>
          <div hlmItemContent>
            <div hlmItemTitle>Research summary</div>
            <p hlmItemDescription>Updated today · 8 pages</p>
          </div>
          <div hlmItemActions>
            <button hlmBtn variant="outline" size="sm" type="button">Open</button>
          </div>
        </div>
        <div hlmItemSeparator></div>
        <div hlmItem variant="default">
          <div hlmItemMedia variant="icon">
            <ng-icon name="lucideMusic" />
          </div>
          <div hlmItemContent>
            <div hlmItemTitle>Interview recording</div>
            <p hlmItemDescription>Added yesterday · Audio</p>
          </div>
          <div hlmItemActions>
            <button hlmBtn variant="outline" size="sm" type="button">Open</button>
          </div>
        </div>
      </div>
    `,
  }),
};
