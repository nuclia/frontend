import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBubbleImports } from '../index';

interface BubbleStoryArgs {
  variant: 'default' | 'secondary' | 'muted' | 'tinted' | 'outline' | 'ghost' | 'destructive';
  align: 'start' | 'end';
}

const meta: Meta<BubbleStoryArgs> = {
  title: 'Spartan/Bubble',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmBubbleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmBubbleImports</code> from <code>@nuclia/ui-spartan/bubble</code>. Compose <code>hlmBubbleGroup</code>, <code>hlmBubble</code>, and <code>hlmBubbleContent</code>; optional reactions are provided by <code>hlmBubbleReactions</code>. Use the alignment to distinguish speakers and do not rely on color alone to communicate authorship.`,
      },
    },
  },
  args: { variant: 'default', align: 'start' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'],
    },
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
  render: ({ variant, align }) => ({
    props: { variant, align },
    template: `<div hlmBubbleGroup class="w-full max-w-lg space-y-3">
      <div hlmBubble [variant]="variant" [align]="align">
        <div hlmBubbleContent>Could you summarize the latest project update?</div>
        <div hlmBubbleReactions aria-label="Reactions">❤️</div>
      </div>
      <div hlmBubble variant="secondary" align="end">
        <div hlmBubbleContent>The team completed the migration and is preparing the release notes.</div>
      </div>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<BubbleStoryArgs>;
export const Default: Story = {};
export const Outgoing: Story = { args: { align: 'end', variant: 'secondary' } };
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<div hlmBubbleGroup class="space-y-3">
      <div hlmBubble variant="default"><div hlmBubbleContent>Default message</div></div>
      <div hlmBubble variant="muted"><div hlmBubbleContent>Muted message</div></div>
      <div hlmBubble variant="outline"><div hlmBubbleContent>Outlined message</div></div>
      <div hlmBubble variant="destructive"><div hlmBubbleContent>Attention needed</div></div>
    </div>`,
  }),
};
