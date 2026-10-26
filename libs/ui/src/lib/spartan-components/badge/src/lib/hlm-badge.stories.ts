import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBadgeImports } from '../index';
import { HlmBadge } from './hlm-badge';

interface BadgeStoryArgs {
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  label: string;
}

const meta: Meta<BadgeStoryArgs> = {
  title: 'Spartan/Badge',
  component: HlmBadge,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmBadgeImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmBadge</code> or <code>HlmBadgeImports</code> from <code>@nuclia/ui-spartan/badge</code>.
Apply <code>hlmBadge</code> to inline text or use <code>hlm-badge</code>; the <code>variant</code> input selects the visual treatment. Keep badge text concise and meaningful so the status is also clear to assistive-technology users.`,
      },
    },
  },
  args: { variant: 'default', label: 'In review' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] },
    label: { control: 'text' },
  },
  render: ({ variant, label }) => ({
    props: { variant, label },
    template: `<span hlmBadge [variant]="variant">{{ label }}</span>`,
  }),
};

export default meta;

type Story = StoryObj<BadgeStoryArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <span hlmBadge>New</span>
        <span hlmBadge variant="secondary">Draft</span>
        <span hlmBadge variant="destructive">Action required</span>
        <span hlmBadge variant="outline">Archived</span>
        <span hlmBadge variant="ghost">Optional</span>
        <span hlmBadge variant="link">Details</span>
      </div>
    `,
  }),
};
