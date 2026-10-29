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
        component: `A compact label that highlights a status, category, or count. Use badges alongside content to make key attributes easy to scan without competing with primary actions.`,
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
