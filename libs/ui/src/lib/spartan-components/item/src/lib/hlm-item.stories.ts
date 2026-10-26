import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmItemImports } from '../index';

interface ItemStoryArgs {
  variant: 'default' | 'outline' | 'muted';
  size: 'default' | 'sm' | 'xs';
}

const meta: Meta<ItemStoryArgs> = {
  title: 'Spartan/Item',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmItemImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmItemImports</code> from <code>@nuclia/ui-spartan/item</code>. Use the item root with media, header/content, title, description, actions, footer, and separator directives as needed. Select the appropriate size and variant for the surrounding list. Use native links or buttons for interactive items and preserve their keyboard focus indicators.`,
      },
    },
  },
  args: { variant: 'outline', size: 'default' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'muted'] },
    size: { control: 'select', options: ['default', 'sm', 'xs'] },
  },
  render: ({ variant, size }) => ({
    props: { variant, size },
    template: `<div hlmItemGroup class="max-w-xl">
      <article hlmItem [variant]="variant" [size]="size">
        <span hlmItemMedia variant="icon" aria-hidden="true">📄</span>
        <div hlmItemContent>
          <div hlmItemHeader><h3 hlmItemTitle>Research summary</h3></div>
          <p hlmItemDescription>Updated today · 8 pages</p>
          <div hlmItemFooter>8 pages · 4 minute read</div>
        </div>
        <div hlmItemActions><button type="button" aria-label="Open research summary">Open</button></div>
      </article>
      <div hlmItemSeparator></div>
      <article hlmItem variant="default" size="sm">
        <span hlmItemMedia variant="icon" aria-hidden="true">♪</span>
        <div hlmItemContent>
          <h3 hlmItemTitle>Interview recording</h3>
          <p hlmItemDescription>Added yesterday · Audio</p>
        </div>
      </article>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<ItemStoryArgs>;
export const Default: Story = {};
export const Muted: Story = { args: { variant: 'muted' } };
export const Compact: Story = { args: { size: 'xs' } };
