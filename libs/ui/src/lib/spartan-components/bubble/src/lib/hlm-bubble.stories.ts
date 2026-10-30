import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBubbleImports } from '../index';
import { HlmBubble, type BubbleAlign, type BubbleVariants } from './hlm-bubble';

interface BubbleStoryArgs {
  variant: NonNullable<BubbleVariants['variant']>;
  align: BubbleAlign;
  message: string;
  showReactions: boolean;
}

const meta: Meta<BubbleStoryArgs> = {
  title: 'Spartan/Bubble',
  component: HlmBubble,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmBubbleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Displays conversational content inside a message bubble, with visual treatments for different speakers and grouped messages. Use it as the content surface within a conversation, with optional reactions or expandable details.
Import <code>HlmBubbleImports</code> from <code>@nuclia/ui-spartan/bubble</code> and place a <code>hlmBubbleContent</code> element inside <code>hlm-bubble</code>; wrap several bubbles in <code>hlmBubbleGroup</code> to stack them.
Set <code>variant</code> for the colour treatment and <code>align</code> (<code>start</code> or <code>end</code>) for the speaker side. Add <code>hlmBubbleReactions</code> (inputs <code>side</code> and <code>align</code>) for reactions that overlap the bubble edge.

<code>hlmBubbleContent</code> can also be a <code>button</code> or <code>a</code> to make the bubble interactive. Reactions should have an <code>aria-label</code> describing them.`,
      },
    },
  },
  args: {
    variant: 'default',
    align: 'start',
    message: 'Could you summarize the latest project update?',
    showReactions: false,
  },
  argTypes: {
    variant: {
      description: 'Colour treatment of the bubble content.',
      control: 'select',
      options: ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'],
    },
    align: {
      description: 'Side of the conversation the bubble sticks to.',
      control: 'inline-radio',
      options: ['start', 'end'],
    },
    message: {
      description: 'Text shown inside <code>hlmBubbleContent</code>.',
      control: 'text',
    },
    showReactions: {
      description: 'Shows an <code>hlmBubbleReactions</code> badge attached to the bubble.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmBubbleGroup class="mb-4 w-full max-w-lg">
        <div hlmBubble [variant]="variant" [align]="align">
          <div hlmBubbleContent>{{ message }}</div>
          @if (showReactions) {
            <div hlmBubbleReactions aria-label="1 thumbs up">👍 1</div>
          }
        </div>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<BubbleStoryArgs>;

export const Default: Story = {};

export const Outgoing: Story = {
  args: {
    align: 'end',
    variant: 'secondary',
    message: 'The team completed the migration and is preparing the release notes.',
  },
};

export const WithReactions: Story = {
  args: {
    variant: 'muted',
    message: 'The new search results look much more relevant.',
    showReactions: true,
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    message: 'We could not generate an answer. Please try again.',
  },
};

export const Variants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmBubbleGroup class="w-full max-w-lg">
        <div hlmBubble variant="default"><div hlmBubbleContent>Default message</div></div>
        <div hlmBubble variant="secondary"><div hlmBubbleContent>Secondary message</div></div>
        <div hlmBubble variant="muted"><div hlmBubbleContent>Muted message</div></div>
        <div hlmBubble variant="tinted"><div hlmBubbleContent>Tinted message</div></div>
        <div hlmBubble variant="outline"><div hlmBubbleContent>Outlined message</div></div>
        <div hlmBubble variant="ghost"><div hlmBubbleContent>Ghost message</div></div>
        <div hlmBubble variant="destructive"><div hlmBubbleContent>Attention needed</div></div>
      </div>
    `,
  }),
};

export const Conversation: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmBubbleGroup class="mb-4 w-full max-w-lg">
        <div hlmBubble variant="muted" align="start">
          <div hlmBubbleContent>Could you summarize the latest project update?</div>
        </div>
        <div hlmBubble variant="default" align="end">
          <div hlmBubbleContent>The team completed the migration and is preparing the release notes.</div>
          <div hlmBubbleReactions side="bottom" align="start" aria-label="1 thumbs up">👍 1</div>
        </div>
      </div>
    `,
  }),
};

export const Interactive: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmBubbleGroup class="w-full max-w-lg">
        <div hlmBubble variant="outline">
          <button hlmBubbleContent type="button">Show the 3 sources used for this answer</button>
        </div>
      </div>
    `,
  }),
};
