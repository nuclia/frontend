import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBadgeImports } from '../index';
import { HlmBadge } from './hlm-badge';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

interface BadgeStoryArgs {
  variant: BadgeVariant;
  label: string;
}

const meta: Meta<BadgeStoryArgs> = {
  title: 'Spartan/Badge',
  component: HlmBadge,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmBadgeImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Highlight a status, count, or short label.
Import <code>HlmBadgeImports</code> from <code>@nuclia/ui-spartan/badge</code> and apply <code>hlmBadge</code> to an element (or use <code>hlm-badge</code>).

Choose a <code>variant</code> to convey meaning; apply it to an anchor to get hover styles for the <code>default</code>, <code>secondary</code>, <code>destructive</code>, and <code>outline</code> variants.`,
      },
    },
  },
  args: {
    variant: 'default',
    label: 'Badge',
  },
  argTypes: {
    variant: {
      description: 'Visual style of the badge.',
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
    },
    label: {
      description: 'Badge text.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <span hlmBadge [variant]="variant">{{ label }}</span>
        `,
  }),
};

export default meta;

type Story = StoryObj<BadgeStoryArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex flex-wrap items-center gap-3">
                <span hlmBadge variant="default">Default</span>
                <span hlmBadge variant="secondary">Secondary</span>
                <span hlmBadge variant="destructive">Destructive</span>
                <span hlmBadge variant="outline">Outline</span>
                <span hlmBadge variant="ghost">Ghost</span>
                <span hlmBadge variant="link">Link</span>
            </div>
        `,
  }),
};

export const AsLink: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <a hlmBadge variant="secondary" href="#">Open link</a>
        `,
  }),
};
